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
  } catch (e) { /* ignore */ }
}

export default function AdvanceTaxInterestCalculator() {
  const [inputs, setInputs] = useState({
    taxPayable: "",
    paidUpto15Jun: "",
    paidUpto15Sep: "",
    paidUpto15Dec: "",
    paidUpto15Mar: "",
    filingDate: ""
  });
  const [userInfo, setUserInfo] = useState({ name: "", mobile: "", email: "" });
  const [results, setResults] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const taxPayable = parseFloat(inputs.taxPayable) || 0;
  const paidUpto15Jun = parseFloat(inputs.paidUpto15Jun) || 0;
  const paidUpto15Sep = parseFloat(inputs.paidUpto15Sep) || 0;
  const paidUpto15Dec = parseFloat(inputs.paidUpto15Dec) || 0;
  const paidUpto15Mar = parseFloat(inputs.paidUpto15Mar) || 0;
  const advanceTaxPaid = paidUpto15Jun + paidUpto15Sep + paidUpto15Dec + paidUpto15Mar;
  const taxLiability = Math.max(0, taxPayable - advanceTaxPaid);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ([
      "taxPayable",
      "paidUpto15Jun",
      "paidUpto15Sep",
      "paidUpto15Dec",
      "paidUpto15Mar"
    ].includes(name)
    ) {
      if (/^(|[0-9]+(\.[0-9]{0,2})?)$/.test(value)) {
        setInputs((prev) => ({ ...prev, [name]: value }));
        setShowResult(false);
      }
    } else {
      setInputs((prev) => ({ ...prev, [name]: value }));
      setShowResult(false);
    }
  };

  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
    setShowResult(false);
  };

  const calculate = async () => {
    if (!userInfo.name.trim() || !userInfo.mobile.trim() || !userInfo.email.trim()) {
      alert("Please fill in your Name, Mobile Number and Email ID!");
      return;
    }

    const filing = new Date(inputs.filingDate);
    const dueDate = new Date("2026-07-31");
    const today = new Date();
    const monthsDelay = inputs.filingDate
      ? Math.max(
        0,
        (filing.getFullYear() - dueDate.getFullYear()) * 12 +
        (filing.getMonth() - dueDate.getMonth()) + 1
      )
      : 0;

    const interest234A =
      monthsDelay > 0 ? taxLiability * 0.01 * monthsDelay : 0;

    // 234B: Only applicable after March 31, 2026 for AY 26-27
    let interest234B = 0;
    const endOfFY = new Date("2026-03-31T23:59:59");
    if (
      taxLiability > 0 &&
      advanceTaxPaid < 0.9 * taxPayable &&
      today > endOfFY
    ) {
      const months =
        (today.getFullYear() - 2026) * 12 +
        (today.getMonth() - 3) + 1;
      interest234B = taxLiability * 0.01 * Math.max(0, months);
    }

    // 234C installment calculations
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
    const paidArr = [paidUpto15Jun, paidUpto15Sep, paidUpto15Dec, paidUpto15Mar];

    for (let i = 0; i < 4; i++) {
      const required = taxPayable * duePercents[i];
      const paid = paidArr[i];
      const due = new Date(dueDates[i]);
      const period = periods[i];
      if (today > due && paid < required) {
        const interest = (required - paid) * 0.01 * period;
        interest234C += interest;
        warningList.push(
          `Installment due upto ${["15-Jun", "15-Sep", "15-Dec", "15-Mar"][i]} is underpaid. Required: ₹${required.toFixed(0)}, Paid: ₹${paid.toFixed(0)}`
        );
        breakdownData.push([
          `Paid upto ${["15-Jun", "15-Sep", "15-Dec", "15-Mar"][i]}`,
          `₹${required.toFixed(2)}`,
          `₹${paid.toFixed(2)}`,
          `₹${interest.toFixed(2)}`
        ]);
      } else {
        breakdownData.push([
          `Paid upto ${["15-Jun", "15-Sep", "15-Dec", "15-Mar"][i]}`,
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
      taxPayable,
      advanceTaxPaid,
      taxLiability,
      paidUpto15Jun,
      paidUpto15Sep,
      paidUpto15Dec,
      paidUpto15Mar,
      interest234A: interest234A.toFixed(2),
      interest234B: interest234B.toFixed(2),
      interest234C: interest234C.toFixed(2),
      totalInterest: (interest234A + interest234B + interest234C).toFixed(2)
    });
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
      head: [["Installment", "Required", "Paid", "Interest u/s 234C"]],
      body: breakdown
    });
    doc.save("Advance_Tax_Interest_Report.pdf");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-3 p-3 rounded" style={{ background: '#e0f3ff', fontWeight: 'bold' }}>
        <div className="text-center text-xl font-bold">Anurag Maheshwari and Company</div>
        <div className="text-center mt-1 font-bold">Email: <span className="font-bold">ai.anurag@ca-anurag.com</span></div>
        <div className="text-center text-2xl mt-4 mb-2 font-bold">Advance Tax Interest Calculator (AY 2026-27)</div>
        <div className="text-center text-base mt-2 px-2 py-1"
          style={{ background: '#b6e0fe', borderRadius: "8px", fontWeight: "bold", margin: "0 auto", maxWidth: "700px" }}>
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
          <div className="flex flex-col col-span-2 mb-0">
            <label className="mb-0">
              Return Filing Date
              <span style={{ color: "red" }}>*</span>:
              <span style={{
                display: "block", fontSize: "0.83em", color: "#666",
                marginTop: 2, marginLeft: 2, fontWeight: 500
              }}>
                (If return is not filed, leave this field blank)
              </span>
            </label>
            <input
              name="filingDate"
              type="date"
              className="border p-2 rounded mt-1"
              value={inputs.filingDate}
              onChange={handleChange}
            />
          </div>
          <label>Tax Payable (after TDS etc.):</label>
          <input
            name="taxPayable"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            className="border p-2 rounded"
            value={inputs.taxPayable}
            onChange={handleChange}
            autoComplete="off"
          />
          <label>Advance Tax Paid:</label>
          <input
            type="text"
            className="border p-2 rounded bg-gray-100"
            value={advanceTaxPaid}
            readOnly
            tabIndex={-1}
          />
          <label>Total Tax Liability:</label>
          <input
            type="text"
            className="border p-2 rounded bg-gray-200"
            value={taxLiability}
            readOnly
            tabIndex={-1}
          />
          <label>Paid upto 15-Jun:</label>
          <input
            name="paidUpto15Jun"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            className="border p-2 rounded"
            value={inputs.paidUpto15Jun}
            onChange={handleChange}
            autoComplete="off"
          />
          <label>Paid upto 15-Sep:</label>
          <input
            name="paidUpto15Sep"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            className="border p-2 rounded"
            value={inputs.paidUpto15Sep}
            onChange={handleChange}
            autoComplete="off"
          />
          <label>Paid upto 15-Dec:</label>
          <input
            name="paidUpto15Dec"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            className="border p-2 rounded"
            value={inputs.paidUpto15Dec}
            onChange={handleChange}
            autoComplete="off"
          />
          <label>Paid upto 15-Mar:</label>
          <input
            name="paidUpto15Mar"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            className="border p-2 rounded"
            value={inputs.paidUpto15Mar}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
          onClick={calculate}
          type="button"
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
              <strong>Interest u/s 234A:</strong> ₹{results.interest234A.toFixed(2)}
            </p>
            <p>
              <strong>Interest u/s 234B:</strong> ₹{results.interest234B.toFixed(2)}
            </p>
            <p>
              <strong>Interest u/s 234C:</strong> ₹{results.interest234C.toFixed(2)}
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
              type="button"
            >
              Export to PDF
            </button>
            <div className="mt-4">
              <table className="min-w-full bg-white border border-gray-300 rounded">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border">Installment</th>
                    <th className="px-2 py-1 border">Required</th>
                    <th className="px-2 py-1 border">Paid</th>
                    <th className="px-2 py-1 border">Interest u/s 234C</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((row, idx) => (
                    <tr key={idx}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-2 py-1 border text-center">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
