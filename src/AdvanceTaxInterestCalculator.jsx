import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxlBL7pXsskl9ks1hiVRC0KgThZPjSu8D4q9GuoQJRscxEY0z7Ca4zThqk2bP6xQZqY/exec";

async function sendToGoogleSheet(rowData) {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rowData)
    });
  } catch {
    // Fail silently; Google Script will log errors
  }
}

export default function AdvanceTaxInterestCalculator() {
  const [inputs, setInputs] = useState({
    filingDate: "",
    taxPayable: "",
    advanceTaxPaid: "",
    installmentDetails: [
      { due: "15-Jun", required: 0, paid: "" },
      { due: "15-Sep", required: 0, paid: "" },
      { due: "15-Dec", required: 0, paid: "" },
      { due: "15-Mar", required: 0, paid: "" }
    ]
  });
  const [userInfo, setUserInfo] = useState({ name: "", mobile: "", email: "" });
  const [results, setResults] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const taxPayable = parseFloat(inputs.taxPayable) || 0;
  const advanceTaxPaid = parseFloat(inputs.advanceTaxPaid) || 0;
  const taxLiability = Math.max(0, taxPayable - advanceTaxPaid);

  const calculate = async () => {
    if (!userInfo.name.trim() || !userInfo.mobile.trim() || !userInfo.email.trim()) {
      alert("Please fill in your Name, Mobile Number and Email ID!");
      return;
    }

    const filing = new Date(inputs.filingDate);
    const dueDate = new Date("2026-07-31");
    const currentDate = new Date();
    const monthsDelay = Math.max(
      0,
      (filing.getFullYear() - dueDate.getFullYear()) * 12 +
        (filing.getMonth() - dueDate.getMonth()) + 1
    );

    const interest234A =
      monthsDelay > 0 ? taxPayable * 0.01 * monthsDelay : 0;

    let interest234B = 0;
    if (taxLiability > 0) {
      const shortfall = taxLiability;
      if (shortfall > 0.1 * (taxLiability + advanceTaxPaid)) {
        const months = Math.max(
          0,
          (currentDate.getFullYear() - new Date("2026-04-01").getFullYear()) * 12 +
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
      const required = (taxLiability + advanceTaxPaid) * duePercents[i];
      const paid = parseFloat(inputs.installmentDetails[i].paid) || 0;
      const due = new Date(dueDates[i]);
      const period = periods[i];

      if (currentDate > due && paid < required) {
        const interest = (required - paid) * 0.01 * period;
        interest234C += interest;
        // Fully corrected template literal below — one line, proper interpolation
        warningList.push(
          `Installment due on ${inputs.installmentDetails[i].due} is underpaid. Required: ₹${required.toFixed(0)}, Paid: ₹${paid.toFixed(0)}`
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
    setShowResult(true);

    const dateString = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    await sendToGoogleSheet({
      date: dateString,
      name: userInfo.name,
      mobile: userInfo.mobile,
      email: userInfo.email,
      filingDate: inputs.filingDate,
      taxPayable: taxPayable,
      advanceTaxPaid: advanceTaxPaid,
      taxLiability: taxLiability,
      paidJun: inputs.installmentDetails[0].paid,
      paidSep: inputs.installmentDetails[1].paid,
      paidDec: inputs.installmentDetails[2].paid,
      paidMar: inputs.installmentDetails[3].paid,
      interest234A: interest234A.toFixed(2),
      interest234B: interest234B.toFixed(2),
      interest234C: interest234C.toFixed(2),
      totalInterest: (interest234A + interest234B + interest234C).toFixed(2)
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
    setShowResult(false);
  };

  const handleInstallmentChange = (index, value) => {
    const updated = [...inputs.installmentDetails];
    updated[index].paid = value;
    setInputs((prev) => ({ ...prev, installmentDetails: updated }));
    setShowResult(false);
  };

  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
    setShowResult(false);
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
      head: [["Installment Due", "Required", "Paid", "Interest u/s 234C"]],
      body: breakdown
    });

    doc.save("Advance_Tax_Interest_Report.pdf");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-3 p-3 rounded" style={{background:'#e0f3ff', fontWeight:'bold'}}>
        <div className="text-center text-xl" style={{fontWeight:"bold"}}>Anurag Maheshwari and Company</div>
        <div className="text-center mt-1" style={{fontWeight:"bold"}}>Email: <span style={{fontWeight:"bold"}}>ai.anurag@ca-anurag.com</span></div>
        <div className="text-center text-2xl mt-4 mb-2" style={{fontWeight:"bold"}}>Advance Tax Interest Calculator (AY 2026-27)</div>
        <div className="text-center text-base mt-2 px-2 py-1" style={{background:'#b6e0fe', borderRadius:"8px", fontWeight:"bold", margin:"0 auto", maxWidth:"700px"}}>
          <b>Our organisation does not share sensitive info as well no one can access your info.</b>
        </div>
      </div>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-2 items-center">
          <label>Your Name:</label>
          <input
            name="name"
            className="border p-2 rounded"
            value={userInfo.name}
            onChange={handleUserInfoChange}
            required
          />
          <label>Mobile Number:</label>
          <input
            name="mobile"
            type="tel"
            className="border p-2 rounded"
            value={userInfo.mobile}
            onChange={handleUserInfoChange}
            required
          />
          <label>Email ID:</label>
          <input
            name="email"
            type="email"
            className="border p-2 rounded"
            value={userInfo.email}
            onChange={handleUserInfoChange}
            required
          />
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
            className="border p-2 rounded bg-gray-200"
            value={taxLiability}
            readOnly
            tabIndex={-1}
          />
          {inputs.installmentDetails.map((inst, idx) => (
            <React.Fragment key={idx}>
              <label>
                <span title={`Required: ₹${((taxLiability + advanceTaxPaid) * [0.15, 0.45, 0.75, 1][idx]).toFixed(0)}`}>
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

        {showResult && results && (
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
