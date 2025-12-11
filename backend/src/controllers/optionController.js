import { Client } from "../models/Client.js";
import { Location } from "../models/Location.js";

export async function listOptions(_req, res) {
  try {
    const [locations, clients] = await Promise.all([
      Location.find().sort({ name: 1 }),
      Client.find().sort({ name: 1 }),
    ]);
    return res.json({
      locations: locations.map((l) => l.name),
      clients: clients.map((c) => c.name),
    });
  } catch (error) {
    console.error("Failed to load options", error);
    return res.status(500).json({ message: "Could not load options" });
  }
}

