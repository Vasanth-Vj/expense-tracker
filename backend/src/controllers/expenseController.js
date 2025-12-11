import ExcelJS from "exceljs";
import { Client } from "../models/Client.js";
import { Expense } from "../models/Expense.js";
import { Location } from "../models/Location.js";

function normalizeName(value) {
  return (value || "").trim();
}

function buildDateFilter(startDate, endDate) {
  const filter = {};
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  return filter;
}

export async function createExpense(req, res) {
  try {
    const { date, fromLocation, toLocation, clientName, kilometers, rupees } =
      req.body || {};

    if (!date || !fromLocation || !toLocation || !clientName || kilometers == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const payload = {
      date,
      fromLocation: normalizeName(fromLocation),
      toLocation: normalizeName(toLocation),
      clientName: normalizeName(clientName),
      kilometers: Number(kilometers),
      rupees: rupees != null ? Number(rupees) : undefined,
    };

    const expense = new Expense(payload);
    await expense.validate();

    const [savedExpense] = await Promise.all([
      expense.save(),
      Location.findOneAndUpdate(
        { name: payload.fromLocation },
        { $setOnInsert: { name: payload.fromLocation } },
        { upsert: true, new: true }
      ),
      Location.findOneAndUpdate(
        { name: payload.toLocation },
        { $setOnInsert: { name: payload.toLocation } },
        { upsert: true, new: true }
      ),
      Client.findOneAndUpdate(
        { name: payload.clientName },
        { $setOnInsert: { name: payload.clientName } },
        { upsert: true, new: true }
      ),
    ]);

    return res.status(201).json(savedExpense);
  } catch (error) {
    console.error("Failed to create expense", error);
    return res.status(500).json({ message: "Could not save expense" });
  }
}

export async function updateExpense(req, res) {
  try {
    const { id } = req.params;
    const { date, fromLocation, toLocation, clientName, kilometers, rupees } =
      req.body || {};

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    expense.date = date ?? expense.date;
    expense.fromLocation = fromLocation ? normalizeName(fromLocation) : expense.fromLocation;
    expense.toLocation = toLocation ? normalizeName(toLocation) : expense.toLocation;
    expense.clientName = clientName ? normalizeName(clientName) : expense.clientName;
    if (kilometers != null) expense.kilometers = Number(kilometers);
    if (rupees != null) expense.rupees = Number(rupees);

    await expense.save();

    // Upsert options when values change
    await Promise.all([
      Location.findOneAndUpdate(
        { name: expense.fromLocation },
        { $setOnInsert: { name: expense.fromLocation } },
        { upsert: true, new: true }
      ),
      Location.findOneAndUpdate(
        { name: expense.toLocation },
        { $setOnInsert: { name: expense.toLocation } },
        { upsert: true, new: true }
      ),
      Client.findOneAndUpdate(
        { name: expense.clientName },
        { $setOnInsert: { name: expense.clientName } },
        { upsert: true, new: true }
      ),
    ]);

    return res.json(expense);
  } catch (error) {
    console.error("Failed to update expense", error);
    return res.status(500).json({ message: "Could not update expense" });
  }
}

export async function deleteExpense(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Expense.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Expense not found" });
    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete expense", error);
    return res.status(500).json({ message: "Could not delete expense" });
  }
}

export async function listExpenses(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const filter = buildDateFilter(startDate, endDate);
    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 });
    return res.json(expenses);
  } catch (error) {
    console.error("Failed to list expenses", error);
    return res.status(500).json({ message: "Could not fetch expenses" });
  }
}

export async function exportExpenses(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const filter = buildDateFilter(startDate, endDate);
    const expenses = await Expense.find(filter).sort({ date: 1, createdAt: 1 });

    const grouped = expenses.reduce((acc, expense) => {
      const key = expense.date.toISOString().slice(0, 10);
      acc[key] = acc[key] || [];
      acc[key].push(expense);
      return acc;
    }, {});

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Expenses");

    const headerRow = sheet.addRow(["Date", "From", "To", "Client", "Km", "₹/Km", "Total"]);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };

    Object.keys(grouped)
      .sort()
      .forEach((dateKey) => {
        const items = grouped[dateKey];
        items.forEach((expense, idx) => {
          sheet.addRow([
            idx === 0 ? dateKey : "",
            expense.fromLocation,
            expense.toLocation,
            expense.clientName,
            expense.kilometers,
            expense.rupees,
            expense.total,
          ]);
        });
      });

    // Total row
    const grandTotal = expenses.reduce((sum, e) => sum + Number(e.total || 0), 0);
    if (expenses.length) {
      sheet.addRow([]);
      const totalRow = sheet.addRow(["", "", "", "Total", "", "", grandTotal]);
      totalRow.font = { bold: true };
      totalRow.getCell(7).numFmt = '"₹"#,##0.00';
    }

    sheet.columns = [
      { width: 14 },
      { width: 22 },
      { width: 22 },
      { width: 24 },
      { width: 10 },
      { width: 10 },
      { width: 12 },
    ];

    sheet.eachRow((row, idx) => {
      row.alignment = { vertical: "middle" };
      row.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      if (idx === 1) return;
      row.getCell(7).numFmt = '"₹"#,##0.00';
      row.getCell(6).numFmt = '#,##0.00';
      row.getCell(5).numFmt = '#,##0.00';
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=expenses.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Failed to export expenses", error);
    return res.status(500).json({ message: "Could not export data" });
  }
}

