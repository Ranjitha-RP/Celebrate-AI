import {
  EventInput,
  HydratedEvent,
  Vendor,
  PlanPatch,
  BudgetAllocation,
  BudgetCategory,
} from "../shared/schemas";

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  loadDemoEvent: async (ownerScope?: string): Promise<HydratedEvent> => {
    const res = await fetch("/api/events/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ownerScope ? { ownerScope } : {}),
    });
    return handleJson<HydratedEvent>(res);
  },

  hydrateFromCloud: async (event: HydratedEvent): Promise<HydratedEvent> => {
    const res = await fetch("/api/events/hydrate-from-cloud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    return handleJson<HydratedEvent>(res);
  },

  createEvent: async (input: EventInput): Promise<HydratedEvent> => {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleJson<HydratedEvent>(res);
  },

  createAndGenerate: async (input: EventInput): Promise<HydratedEvent> => {
    const res = await fetch("/api/events/create-and-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleJson<HydratedEvent>(res);
  },

  generatePlan: async (eventId: string): Promise<HydratedEvent> => {
    const res = await fetch(`/api/events/${eventId}/generate-plan`, {
      method: "POST",
    });
    return handleJson<HydratedEvent>(res);
  },

  getEvent: async (eventId: string): Promise<HydratedEvent> => {
    const res = await fetch(`/api/events/${eventId}`);
    return handleJson<HydratedEvent>(res);
  },

  updateBudget: async (
    eventId: string,
    payload: {
      totalBudget?: number;
      allocations?: BudgetAllocation[];
      autoRebalance?: boolean;
      changedCategory?: BudgetCategory;
    }
  ): Promise<HydratedEvent> => {
    const res = await fetch(`/api/events/${eventId}/budget`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleJson<HydratedEvent>(res);
  },

  addTask: async (
    eventId: string,
    payload: {
      title: string;
      category: string;
      daysBefore: number;
      priority: "high" | "medium" | "low";
    }
  ): Promise<HydratedEvent> => {
    const res = await fetch(`/api/events/${eventId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleJson<HydratedEvent>(res);
  },

  toggleTask: async (
    eventId: string,
    taskId: string,
    completed: boolean
  ): Promise<HydratedEvent> => {
    const res = await fetch(`/api/events/${eventId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    return handleJson<HydratedEvent>(res);
  },

  updateRunSheetStatus: async (
    eventId: string,
    itemId: string,
    status: "scheduled" | "arrived" | "completed"
  ): Promise<HydratedEvent> => {
    const res = await fetch(`/api/events/${eventId}/runsheet/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return handleJson<HydratedEvent>(res);
  },

  sendChat: async (
    eventId: string,
    message: string
  ): Promise<{ event: HydratedEvent; patch: PlanPatch }> => {
    const res = await fetch(`/api/events/${eventId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    return handleJson<{ event: HydratedEvent; patch: PlanPatch }>(res);
  },

  upsertGuest: async (
    eventId: string,
    guest: {
      id?: string;
      name: string;
      contact?: string;
      status: "yes" | "no" | "pending";
      partySize: number;
      dietaryPreference: string;
      notes?: string;
    }
  ): Promise<HydratedEvent> => {
    const res = await fetch(`/api/events/${eventId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guest),
    });
    return handleJson<HydratedEvent>(res);
  },

  getPublicRsvp: async (token: string) => {
    const res = await fetch(`/api/rsvp/${token}`);
    return handleJson<{
      eventId: string;
      title: string;
      date: string;
      city: string;
      subTradition: string;
      venueName: string;
      muhuratWindow: string;
      invitation: HydratedEvent["invitation"];
      theme: NonNullable<HydratedEvent["plan"]>["theme"] | null;
    }>(res);
  },

  submitPublicRsvp: async (
    token: string,
    payload: {
      name: string;
      contact: string;
      status: "yes" | "no";
      partySize: number;
      dietaryPreference: string;
      notes: string;
    }
  ) => {
    const res = await fetch(`/api/rsvp/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleJson<{ ok: boolean; message: string }>(res);
  },

  listVendors: async (params: {
    city?: string;
    category?: string;
    maxPrice?: number;
    search?: string;
  }): Promise<{ vendors: Vendor[] }> => {
    const qs = new URLSearchParams();
    if (params.city) qs.set("city", params.city);
    if (params.category) qs.set("category", params.category);
    if (params.maxPrice) qs.set("maxPrice", String(params.maxPrice));
    if (params.search) qs.set("search", params.search);
    const res = await fetch(`/api/vendors?${qs.toString()}`);
    return handleJson<{ vendors: Vendor[] }>(res);
  },

  toggleShortlist: async (
    eventId: string,
    vendorId: string
  ): Promise<HydratedEvent> => {
    const res = await fetch(`/api/events/${eventId}/shortlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId }),
    });
    return handleJson<HydratedEvent>(res);
  },

  generateInvitation: async (
    eventId: string,
    tone: string,
    hostLine: string
  ): Promise<HydratedEvent> => {
    const res = await fetch(`/api/events/${eventId}/invitation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tone, hostLine }),
    });
    return handleJson<HydratedEvent>(res);
  },
};
