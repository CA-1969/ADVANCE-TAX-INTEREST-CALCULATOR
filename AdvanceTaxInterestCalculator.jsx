import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdvanceTaxInterestCalculator() {
  const [inputs, setInputs] = useState({
    filingDate: "",
    taxPayable: "",
    advanceTaxPaid: "",
    taxLiability: "",
    installmentDetails: [
      { due: "15-Jun", required: 0, paid: "" },
      { due: "15-Sep", required: 0, paid: "" },
      { due: "15-Dec", required: 0, paid: "" },
      { due: "15-Mar", required: 0, paid: "" }
    ]
  });
  const [results, setResults] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [breakdown, setBreakdown] = useState([]);

  const calculate = () => {
    const filing = new Date(inputs.filingDate);
    const dueDate = new Date("2026-07-31");
    const currentDate = new Date();
    const monthsDelay = Math.max(
      0,
      (filing.getFullYear() - dueDate.getFullYear()) * 12 +
        (filing.getMonth() - dueDate.getMonth()) +
        1
    );

    const taxPayable = parseFloat(inputs.taxPayable) || 0;
    const advanceTaxPaid = parseFloat(inputs.advanceTaxPaid) || 0;
    const taxLiability = parseFloat(inputs.taxLiability) || 0;

    const interest234A =
      monthsDelay > 0 ? taxPayable * 0.01 * monthsDelay : 0;

    let interest234B = 0;
    if (taxLiability > 0) {
      const shortfall = taxLiability - advanceTaxPaid;
      if (shortfall > 0.1 * taxLiability) {
        const months = Math.max(
          0,
          (currentDate.getFullYear() - new Date("2026-04-01").getFullYear()) *
            12 +
            (currentDate.getMonth() - 3)
        );
        interest234B = shortfall * 0.01 * months;
      }
    }

    const duePercents = [0.15, 0.45, 0.75, 1];
    const dueDates = [
      "2025-06-15",
      "2025-09-15",
      "2025-12-15",
      "2026-03-15"
    ];
    const periods = [3, 3, 3, 1];
    let interest234C = 0;
    let warningList = [];
    let breakdownData = [];

    for (let i = 0; i < 4; i++) {
      const required = taxLiability * duePercents[i];
      const paid = parseFloat(inputs.installmentDetails[i].paid) || 0;
      const due = new Date(dueDates[i]);
      const period = periods[i];

      if (currentDate > due && paid < required) {
        const interest = (required - paid) * 0.01 * period;
        interest234C += interest;
        warningList.push(
          `Installment due on ${
            inputs.installmentDetails[i].due
          } is underpaid. Required: ₹${required.toFixed(
            0
          )}, Paid: ₹${paid.toFixed(0)}`
        );
        breakdownData.push([
          inputs.installmentDetails[i].due,
          `₹${required.toFixed(2)}`,
          `₹${paid.toFixed(2)}`,
          `₹${interest.toFixed(2)}`
        ]);
      } else {
        breakdownData.push([
          inputs.installmentDetails[i].due,
          `₹${required.toFixed(2)}`,
          `₹${paid.toFixed(2)}`,
          `₹0.00`
        ]);
      }
    }

    setResults({ interest234A, interest234B, interest234C });
    setWarnings(warningList);
    setBreakdown(breakdownData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleInstallmentChange = (index, value) => {
    const updated = [...inputs.installmentDetails];
    updated[index].paid = value;
    setInputs((prev) => ({ ...prev, installmentDetails: updated }));
  };

  const exportPDF = () => {
    if (!results) return;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Anurag Maheshwari and Company", 14, 16);
    doc.setFontSize(10);
    doc.text("Email: ai.anurag@ca-anurag.com", 14, 22);
    doc.text("Advance Tax Interest Report (AY 2026-27)", 14, 30);

    autoTable(doc, {
      startY: 36,
      head: [["Section", "Interest (₹)"]],
      body: [
        ["234A", results.interest234A.toFixed(2)],
        ["234B", results.interest234B.toFixed(2)],
        ["234C", results.interest234C.toFixed(2)],
        [
          "Total",
          (
            results.interest234A +
            results.interest234B +
            results.interest234C
          ).toFixed(2)
        ]
      ]
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [
        ["Installment Due", "Required", "Paid", "Interest u/s 234C"]
      ],
      body: breakdown
    });

    doc.save("Advance_Tax_Interest_Report.pdf");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-2 text-center">
        Anurag Maheshwari and Company
      </h1>
      <p className="text-center text-sm mb-4">
        Email: ai.anurag@ca-anurag.com
      </p>
      <h2 className="text-2xl font-bold mb-4 text-center">
        Advance Tax Interest Calculator (AY 2026-27)
      </h2>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-2 items-center">
          <label>Return Filing Date:</label>
          <input
            name="filingDate"
            type="date"
            className="border p-2 rounded"
            onChange={handleChange}
          />

          <label>Tax Payable (after TDS etc.):</label>
          <input
            name="taxPayable"
            type="number"
            className="border p-2 rounded"
            onChange={handleChange}
          />

          <label>Advance Tax Paid:</label>
          <input
            name="advanceTaxPaid"
            type="number"
            className="border p-2 rounded"
            onChange={handleChange}
          />

          <label>Total Tax Liability:</label>
          <input
            name="taxLiability"
            type="number"
            className="border p-2 rounded"
            onChange={handleChange}
          />

          {inputs.installmentDetails.map((inst, idx) => (
            <React.Fragment key={idx}>
              <label>
                <span title={`Required: ₹${(parseFloat(inputs.taxLiability || 0) * [0.15, 0.45, 0.75, 1][idx]).toFixed(0)}`}>
                  Paid on {inst.due}:
                </span>
              </label>
              <input
                type="number"
                className="border p-2 rounded"
                onChange={(e) =>
                  handleInstallmentChange(idx, e.target.value)
                }
              />
            </React.Fragment>
          ))}
        </div>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
          onClick={calculate}
        >
          Calculate Interest
        </button>

        {warnings.length > 0 && (
          <div className="mt-2 text-yellow-700 bg-yellow-100 p-2 rounded">
            <ul>
              {warnings.map((msg, i) => (
                <li key={i}>⚠️ {msg}</li>
              ))}
            </ul>
          </div>
        )}

        {results && (
          <div className="mt-4 border-t pt-4">
            <p>
              <strong>Interest u/s 234A:</strong> ₹
              {results.interest234A.toFixed(2)}
            </p>
            <p>
              <strong>Interest u/s 234B:</strong> ₹
              {results.interest234B.toFixed(2)}
            </p>
            <p>
              <strong>Interest u/s 234C:</strong> ₹
              {results.interest234C.toFixed(2)}
            </p>
            <p className="font-bold text-lg mt-2">
              Total Interest Payable: ₹
              {(
                results.interest234A +
                results.interest234B +
                results.interest234C
              ).toFixed(2)}
            </p>
            <button
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
              onClick={exportPDF}
            >
              Export to PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
