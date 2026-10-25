import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import {
  EventInputSchema,
  BudgetCategory,
  BudgetCategoryEnum,
} from "./src/shared/schemas.ts";
import {
  getDb,
  listRecentEvents,
  getHydratedEvent,
  getEventByRsvpToken,
  createEventRecord,
  updateEventCore,
  replaceEventTasks,
  addEventTask,
  toggleEventTask,
  upsertGuestRecord,
  seedOrResetDemoEvent,
} from "./server/db/sqlite.ts";
import {
  createInitialBudgetAllocations,
  optimizeBudgetAllocations,
} from "./server/optimizer/budgetOptimizer.ts";
import { vectorStore } from "./server/rag/vectorStore.ts";
import {
  generateGroundedEventPlan,
  generatePlanPatchFromChat,
  generateTrilingualInvitation,
  buildInstantTrilingualInvitation,
} from "./server/services/aiPlanner.ts";

let cachedApiAppPromise: Promise<express.Express> | null = null;

export function getExpressApiApp(): Promise<express.Express> {
  if (!cachedApiAppPromise) {
    cachedApiAppPromise = (async () => {
      await getDb();
      const existingDemo = await getHydratedEvent("evt-golden-jubilee-blr");
      if (!existingDemo) {
        await seedOrResetDemoEvent();
      }

      const app = express();
      app.use(express.json({ limit: "2mb" }));

  // 1. Health & Recent Events
  app.get("/api/events", async (_req, res) => {
    try {
      const list = await listRecentEvents();
      res.json({ events: list });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // 2. Instant Demo Loader ("50th anniversary, 120 guests, Rs 5,00,000, Bengaluru")
  app.post("/api/events/demo", async (req, res) => {
    try {
      const ownerScope =
        typeof req.body?.ownerScope === "string" ? req.body.ownerScope : undefined;
      const demo = await seedOrResetDemoEvent(ownerScope);
      res.json(demo);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // 2b. Hydrate a Firestore-saved event into local SQLite working engine
  app.post("/api/events/hydrate-from-cloud", async (req, res) => {
    try {
      const body = req.body;
      if (!body || typeof body.id !== "string" || typeof body.rsvpToken !== "string") {
        res.status(400).json({ error: "Invalid cloud event payload" });
        return;
      }
      const parsedInput = EventInputSchema.safeParse(body.input);
      if (!parsedInput.success) {
        res.status(400).json({ error: "Invalid event input in cloud payload" });
        return;
      }
      const hydrated = await createEventRecord({
        id: body.id,
        rsvpToken: body.rsvpToken,
        input: parsedInput.data,
        plan: body.plan ?? null,
        budget: Array.isArray(body.budget) ? body.budget : [],
        budgetTradeoffNote: String(body.budgetTradeoffNote || ""),
        tasks: Array.isArray(body.tasks) ? body.tasks : [],
        guests: Array.isArray(body.guests) ? body.guests : [],
        shortlistedVendorIds: Array.isArray(body.shortlistedVendorIds)
          ? body.shortlistedVendorIds
          : [],
        invitation: body.invitation ?? null,
        chatHistory: Array.isArray(body.chatHistory) ? body.chatHistory : [],
      });
      res.json(hydrated);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // 3. POST /api/events — Create Event + Initial Smart Budget Split
  app.post("/api/events", async (req, res) => {
    try {
      const parsed = EventInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid event input",
          details: parsed.error.flatten(),
        });
        return;
      }

      const id = `evt-${crypto.randomBytes(4).toString("hex")}`;
      const rsvpToken = `rsvp-${crypto.randomBytes(4).toString("hex")}`;
      const initialBudget = createInitialBudgetAllocations(
        parsed.data.eventType,
        parsed.data.totalBudget
      );

      const created = await createEventRecord({
        id,
        rsvpToken,
        input: parsed.data,
        budget: initialBudget,
        budgetTradeoffNote: `Auto-allocated ₹${parsed.data.totalBudget.toLocaleString("en-IN")} across 6 categories tailored for a ${parsed.data.eventType} in ${parsed.data.city}.`,
        plan: null,
        tasks: [],
        guests: [],
        shortlistedVendorIds: [],
        invitation: null,
        chatHistory: [],
      });

      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // 4. POST /api/events/:id/generate-plan — RAG Retrieval + Gemini Structured Plan + Checklist + Default Invite
  app.post("/api/events/:id/generate-plan", async (req, res) => {
    try {
      const event = await getHydratedEvent(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      const { plan, tasks } = await generateGroundedEventPlan(
        event.id,
        event.input,
        event.budget
      );

      const shortlist = Array.from(
        new Set([
          ...event.shortlistedVendorIds,
          plan.venueSuggestions[0]?.citedVendorId,
          plan.cateringPlan.citedVendorId,
          plan.decorPlan.citedVendorId,
          plan.entertainmentPlan.citedVendorId,
          plan.photographyPlan.citedVendorId,
        ].filter(Boolean))
      );

      await replaceEventTasks(event.id, tasks);

      const tempHydrated = { ...event, plan };
      const invitation = buildInstantTrilingualInvitation(
        tempHydrated,
        "Warm Traditional",
        "Hosted with love by the Family"
      );

      const welcomeMsg = {
        id: `MSG-${Date.now()}`,
        role: "assistant" as const,
        content: `Your grounded celebration plan for ${event.input.title} in ${event.input.city} is ready! Every recommendation cites verified vendors & cultural guides. Ask me to adjust budgets, swap vendors, or customize the menu anytime.`,
        createdAt: new Date().toISOString(),
      };

      const updated = await updateEventCore(event.id, {
        plan,
        shortlistedVendorIds: shortlist,
        invitation,
        chatHistory: [welcomeMsg],
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // 4b. POST /api/events/create-and-generate — Single-roundtrip fast creation + grounded plan synthesis
  app.post("/api/events/create-and-generate", async (req, res) => {
    try {
      const parsed = EventInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid event input",
          details: parsed.error.flatten(),
        });
        return;
      }

      const id = `evt-${crypto.randomBytes(4).toString("hex")}`;
      const rsvpToken = `rsvp-${crypto.randomBytes(4).toString("hex")}`;
      const initialBudget = createInitialBudgetAllocations(
        parsed.data.eventType,
        parsed.data.totalBudget
      );

      const { plan, tasks } = await generateGroundedEventPlan(
        id,
        parsed.data,
        initialBudget
      );

      const shortlist = Array.from(
        new Set(
          [
            plan.venueSuggestions[0]?.citedVendorId,
            plan.cateringPlan.citedVendorId,
            plan.decorPlan.citedVendorId,
            plan.entertainmentPlan.citedVendorId,
            plan.photographyPlan.citedVendorId,
          ].filter(Boolean)
        )
      );

      const invitation = buildInstantTrilingualInvitation(
        { input: parsed.data, plan },
        "Warm Traditional",
        "Hosted with love by the Family"
      );

      const welcomeMsg = {
        id: `MSG-${Date.now()}`,
        role: "assistant" as const,
        content: `Your grounded celebration plan for ${parsed.data.title} in ${parsed.data.city} is ready! Every recommendation cites verified vendors & cultural guides. Ask me to adjust budgets, swap vendors, or customize the menu anytime.`,
        createdAt: new Date().toISOString(),
      };

      const created = await createEventRecord({
        id,
        rsvpToken,
        input: parsed.data,
        budget: initialBudget,
        budgetTradeoffNote: `Auto-allocated ₹${parsed.data.totalBudget.toLocaleString("en-IN")} across 6 categories tailored for a ${parsed.data.eventType} in ${parsed.data.city}.`,
        plan,
        tasks,
        guests: [],
        shortlistedVendorIds: shortlist,
        invitation,
        chatHistory: [welcomeMsg],
      });

      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // 5. GET /api/events/:id
  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await getHydratedEvent(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }
      res.json(event);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // 6. PATCH /api/events/:id/budget — Edit category planned/spent, lock, or run Constraint Optimizer
  app.patch("/api/events/:id/budget", async (req, res) => {
    try {
      const event = await getHydratedEvent(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      const {
        totalBudget,
        allocations,
        autoRebalance,
        changedCategory,
      }: {
        totalBudget?: number;
        allocations?: typeof event.budget;
        autoRebalance?: boolean;
        changedCategory?: BudgetCategory;
      } = req.body;

      const nextTotal =
        typeof totalBudget === "number" && totalBudget >= 25000
          ? totalBudget
          : event.input.totalBudget;

      let workingBudget = Array.isArray(allocations) ? allocations : event.budget;
      let tradeoffNote = event.budgetTradeoffNote;

      if (autoRebalance) {
        const pinned = new Set<BudgetCategory>();
        if (changedCategory && BudgetCategoryEnum.safeParse(changedCategory).success) {
          pinned.add(changedCategory);
        }
        const solved = optimizeBudgetAllocations(workingBudget, nextTotal, pinned);
        workingBudget = solved.allocations;
        tradeoffNote = solved.tradeoffExplanation;
      } else {
        const plannedSum = workingBudget.reduce((s, b) => s + b.plannedAmount, 0);
        const delta = plannedSum - nextTotal;
        tradeoffNote =
          delta === 0
            ? `Planned allocations match your exact ₹${nextTotal.toLocaleString("en-IN")} budget.`
            : delta > 0
            ? `Planned allocations exceed target budget by ₹${delta.toLocaleString("en-IN")}. Click 'Auto-Rebalance' to optimize within constraints.`
            : `You have ₹${Math.abs(delta).toLocaleString("en-IN")} unallocated buffer remaining.`;
      }

      const updated = await updateEventCore(event.id, {
        input: { ...event.input, totalBudget: nextTotal },
        budget: workingBudget,
        budgetTradeoffNote: tradeoffNote,
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // 7. Tasks & Run-sheet coordination updates
  app.post("/api/events/:id/tasks", async (req, res) => {
    try {
      const event = await getHydratedEvent(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }
      const { title, category = "misc", daysBefore = 7, priority = "medium" } = req.body;
      if (!title || typeof title !== "string") {
        res.status(400).json({ error: "Task title is required" });
        return;
      }
      const base = new Date(event.input.date + "T00:00:00");
      base.setDate(base.getDate() - Number(daysBefore));
      await addEventTask({
        id: `TSK-${Date.now()}`,
        eventId: event.id,
        title: title.trim(),
        category,
        daysBefore: Number(daysBefore),
        dueDate: base.toISOString().slice(0, 10),
        priority: priority === "high" || priority === "low" ? priority : "medium",
        completed: false,
      });
      res.json(await getHydratedEvent(event.id));
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.patch("/api/events/:id/tasks/:taskId", async (req, res) => {
    try {
      await toggleEventTask(req.params.id, req.params.taskId, Boolean(req.body.completed));
      res.json(await getHydratedEvent(req.params.id));
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.patch("/api/events/:id/runsheet/:itemId", async (req, res) => {
    try {
      const event = await getHydratedEvent(req.params.id);
      if (!event || !event.plan) {
        res.status(404).json({ error: "Event plan not found" });
        return;
      }
      const status = req.body.status as "scheduled" | "arrived" | "completed";
      const nextRunSheet = event.plan.runSheet.map((item) =>
        item.id === req.params.itemId ? { ...item, status } : item
      );
      const updated = await updateEventCore(event.id, {
        plan: { ...event.plan, runSheet: nextRunSheet },
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // 8. POST /api/events/:id/chat — Conversational Plan Patching + Live Optimizer Rebalance
  app.post("/api/events/:id/chat", async (req, res) => {
    try {
      const event = await getHydratedEvent(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }
      const message = String(req.body.message || "").trim();
      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      const patch = await generatePlanPatchFromChat(event, message);

      let nextTotalBudget = event.input.totalBudget;
      if (patch.newTotalBudget && patch.newTotalBudget >= 25000) {
        nextTotalBudget = Math.round(patch.newTotalBudget);
      }

      let workingBudget = event.budget.map((b) => ({ ...b }));
      const pinned = new Set<BudgetCategory>();

      for (const adj of patch.categoryBudgetAdjustments) {
        const target = workingBudget.find((b) => b.category === adj.category);
        if (target && adj.targetAmount >= 0) {
          target.plannedAmount = Math.round(adj.targetAmount);
          target.rationale = adj.reason || target.rationale;
          pinned.add(adj.category);
        }
      }

      let nextTradeoffNote = event.budgetTradeoffNote;
      if (
        patch.newTotalBudget ||
        patch.categoryBudgetAdjustments.length > 0 ||
        patch.changedSections.includes("budget")
      ) {
        const solved = optimizeBudgetAllocations(workingBudget, nextTotalBudget, pinned);
        workingBudget = solved.allocations;
        nextTradeoffNote = solved.tradeoffExplanation;
      }

      let nextPlan = event.plan ? { ...event.plan } : null;
      const nextShortlist = new Set(event.shortlistedVendorIds);

      if (nextPlan) {
        for (const swap of patch.vendorSwaps) {
          const verified = vectorStore.getVendorById(swap.citedVendorId);
          const vendorId = verified ? verified.id : swap.citedVendorId;
          const vendorName = verified ? verified.name : swap.citedVendorName;
          nextShortlist.add(vendorId);

          if (swap.section === "venue" && nextPlan.venueSuggestions.length > 0) {
            nextPlan.venueSuggestions = [
              {
                ...nextPlan.venueSuggestions[0],
                citedVendorId: vendorId,
                citedVendorName: vendorName,
                estimatedCostInr: swap.estimatedCostInr,
                rationale: swap.rationale,
              },
              ...nextPlan.venueSuggestions.slice(1),
            ];
          } else if (swap.section === "catering") {
            nextPlan.cateringPlan = {
              ...nextPlan.cateringPlan,
              citedVendorId: vendorId,
              citedVendorName: vendorName,
              estimatedTotalInr: swap.estimatedCostInr,
              perPlateInr: Math.round(
                swap.estimatedCostInr / Math.max(1, event.input.guestCount)
              ),
              rationale: swap.rationale,
            };
          } else if (swap.section === "decor") {
            nextPlan.decorPlan = {
              ...nextPlan.decorPlan,
              citedVendorId: vendorId,
              citedVendorName: vendorName,
              estimatedCostInr: swap.estimatedCostInr,
              rationale: swap.rationale,
            };
          } else if (swap.section === "entertainment") {
            nextPlan.entertainmentPlan = {
              ...nextPlan.entertainmentPlan,
              citedVendorId: vendorId,
              citedVendorName: vendorName,
              estimatedCostInr: swap.estimatedCostInr,
              rationale: swap.rationale,
            };
          } else if (swap.section === "photography") {
            nextPlan.photographyPlan = {
              ...nextPlan.photographyPlan,
              citedVendorId: vendorId,
              citedVendorName: vendorName,
              estimatedCostInr: swap.estimatedCostInr,
              rationale: swap.rationale,
            };
          }
        }

        if (patch.menuAdditions.length > 0) {
          nextPlan.cateringPlan = {
            ...nextPlan.cateringPlan,
            desserts: [
              ...nextPlan.cateringPlan.desserts,
              ...patch.menuAdditions,
            ],
          };
        }
      }

      for (const t of patch.tasksToAdd) {
        const base = new Date(event.input.date + "T00:00:00");
        base.setDate(base.getDate() - Math.max(1, t.daysBefore));
        await addEventTask({
          id: `TSK-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          eventId: event.id,
          title: t.title,
          category: t.category,
          daysBefore: t.daysBefore,
          dueDate: base.toISOString().slice(0, 10),
          priority: t.priority,
          completed: false,
        });
      }

      const userChat = {
        id: `MSG-U-${Date.now()}`,
        role: "user" as const,
        content: message,
        createdAt: new Date().toISOString(),
      };
      const aiChat = {
        id: `MSG-A-${Date.now() + 1}`,
        role: "assistant" as const,
        content: patch.assistantMessage,
        changedSections: patch.changedSections,
        createdAt: new Date().toISOString(),
      };

      const updated = await updateEventCore(event.id, {
        input: { ...event.input, totalBudget: nextTotalBudget },
        plan: nextPlan,
        budget: workingBudget,
        budgetTradeoffNote: nextTradeoffNote,
        shortlistedVendorIds: Array.from(nextShortlist),
        chatHistory: [...event.chatHistory, userChat, aiChat],
      });

      res.json({
        event: updated,
        patch,
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // 9. Guests & Public RSVP Endpoints
  app.get("/api/events/:id/guests", async (req, res) => {
    const event = await getHydratedEvent(req.params.id);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json({ guests: event.guests, rsvpToken: event.rsvpToken });
  });

  app.post("/api/events/:id/guests", async (req, res) => {
    try {
      const event = await getHydratedEvent(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }
      const {
        id,
        name,
        contact = "",
        status = "pending",
        partySize = 1,
        dietaryPreference = "Pure Veg",
        notes = "",
      } = req.body;

      if (!name || typeof name !== "string") {
        res.status(400).json({ error: "Guest name is required" });
        return;
      }

      await upsertGuestRecord({
        id: id || `GST-${Date.now()}`,
        eventId: event.id,
        name: name.trim(),
        contact: String(contact),
        status: status === "yes" || status === "no" ? status : "pending",
        partySize: Math.max(1, Math.min(20, Number(partySize) || 1)),
        dietaryPreference: String(dietaryPreference),
        notes: String(notes),
      });

      res.json(await getHydratedEvent(event.id));
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/rsvp/:token", async (req, res) => {
    const event = await getEventByRsvpToken(req.params.token);
    if (!event) {
      res.status(404).json({ error: "RSVP invitation link not found" });
      return;
    }
    res.json({
      eventId: event.id,
      title: event.input.title,
      date: event.input.date,
      city: event.input.city,
      subTradition: event.input.subTradition,
      venueName:
        event.plan?.venueSuggestions?.[0]?.citedVendorName ||
        `${event.input.city} Celebration Venue`,
      muhuratWindow: event.plan?.culturalAdvisory.muhuratWindow || "",
      invitation: event.invitation,
      theme: event.plan?.theme || null,
    });
  });

  app.post("/api/rsvp/:token", async (req, res) => {
    try {
      const event = await getEventByRsvpToken(req.params.token);
      if (!event) {
        res.status(404).json({ error: "RSVP link not found" });
        return;
      }
      const {
        name,
        contact = "",
        status = "yes",
        partySize = 1,
        dietaryPreference = "Pure Veg",
        notes = "",
      } = req.body;

      if (!name || typeof name !== "string") {
        res.status(400).json({ error: "Your name is required" });
        return;
      }

      // Match existing guest by name if invited, else add new RSVP entry
      const existingGuest = event.guests.find(
        (g) => g.name.toLowerCase() === name.trim().toLowerCase()
      );

      await upsertGuestRecord({
        id: existingGuest ? existingGuest.id : `GST-RSVP-${Date.now()}`,
        eventId: event.id,
        name: name.trim(),
        contact: String(contact || existingGuest?.contact || ""),
        status: status === "no" ? "no" : "yes",
        partySize: Math.max(1, Math.min(20, Number(partySize) || 1)),
        dietaryPreference: String(dietaryPreference),
        notes: String(notes),
      });

      res.json({ ok: true, message: "Thank you! Your RSVP has been recorded." });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // 10. GET /api/vendors & Shortlisting
  app.get("/api/vendors", (req, res) => {
    const vendors = vectorStore.filterVendors({
      city: req.query.city ? String(req.query.city) : undefined,
      category: req.query.category ? String(req.query.category) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
    });
    res.json({ vendors });
  });

  app.post("/api/events/:id/shortlist", async (req, res) => {
    const event = await getHydratedEvent(req.params.id);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const vendorId = String(req.body.vendorId || "");
    const set = new Set(event.shortlistedVendorIds);
    if (set.has(vendorId)) {
      set.delete(vendorId);
    } else if (vendorId) {
      set.add(vendorId);
    }
    const updated = await updateEventCore(event.id, {
      shortlistedVendorIds: Array.from(set),
    });
    res.json(updated);
  });

  // 11. POST /api/events/:id/invitation — Trilingual AI Invitation Generator
  app.post("/api/events/:id/invitation", async (req, res) => {
    try {
      const event = await getHydratedEvent(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }
      const tone = String(req.body.tone || "Warm Traditional");
      const hostLine = String(
        req.body.hostLine || "Hosted with love by the Family"
      );
      const invitation = await generateTrilingualInvitation(event, tone, hostLine);
      const updated = await updateEventCore(event.id, { invitation });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

      return app;
    })();
  }
  return cachedApiAppPromise;
}

async function startServer() {
  const app = await getExpressApiApp();

  // Mount Vite dev server in development or static dist in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Celebrate AI server listening on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  void startServer();
}
