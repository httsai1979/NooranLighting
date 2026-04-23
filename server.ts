import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import Papa from "papaparse";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const SHEET_ID = "1CP0xxEZGIOr7Se-aGzkgrDli774U1FkXNhs7GeYiqx0";

  // API Route to fetch sheet data
  app.get("/api/data", async (req, res) => {
    try {
      const fetchSheet = async (sheetName: string) => {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
        const response = await axios.get(url);
        return Papa.parse(response.data, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        }).data;
      };

      const [lampsRaw, accessoriesRaw] = await Promise.all([
        fetchSheet("S10_Magnetic_lamp"),
        fetchSheet("S10_Track&accessory"),
      ]);

      // Process Lamps
      const lamps = (lampsRaw as any[]).map((row) => ({
        model: row.Model,
        price: row.Price,
        power: parseFloat(row["Power(W)"]) || parseFloat(row.Power) || 0,
        photo: row.Photo ? `https://drive.google.com/thumbnail?id=${row.Photo}&sz=w1000` : null,
        specs: {
          size: row.Size,
          cri: row.CRI,
          voltage: row.Voltage,
          beamAngle: row["Beam Angle"],
          cct: row.CCT,
          data: row.SpecsData || row.Specification || "",
        },
      })).filter(l => l.model);

      // Process Accessories
      const accessories = (accessoriesRaw as any[]).map((row) => ({
        model: row.Model,
        category: row.Category,
        price: row.Price,
        photo: row.Photo ? `https://drive.google.com/thumbnail?id=${row.Photo}&sz=w1000` : null,
        specs: row.SpecsData || row.Specification || "",
        capacity: row.Capacity || null, // For drivers
      })).filter(a => a.model);

      res.json({ lamps, accessories });
    } catch (error) {
      console.error("Error fetching sheet data:", error);
      res.status(500).json({ error: "Failed to fetch data from Google Sheets" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
