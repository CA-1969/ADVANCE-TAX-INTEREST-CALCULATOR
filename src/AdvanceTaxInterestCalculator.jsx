import React, { useState } from "react";

function AdvanceTaxCalculator() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    filingDate: "",
    taxPayable: "",
    paidJun: "",
    paidSep: "",
    paidDec: "",
    paidMar: "",
  });

  // Calculate Advance Tax Paid as the sum of respective paid amounts
  const advanceTaxPaid =
    (parseInt(form.paidJun, 10) || 0) +
    (parseInt(form.paidSep, 10) || 0) +
    (parseInt(form.paidDec, 10) || 0) +
    (parseInt(form.paidMar, 10) || 0);

  // Calculate Remaining Tax Liability
  const totalRemainingTaxLiability =
    (parseInt(form.taxPayable, 10) || 0) - advanceTaxPaid;

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form>
      <label>
        Your Name:
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
        />
      </label>
      <label>
        Mobile Number:
        <input
          type="text"
          name="mobile"
          value={form.mobile}
          onChange={handleChange}
        />
      </label>
      <label>
        Email ID:
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
        />
      </label>
      <label>
        Return Filing Date:
        <input
          type="date"
          name="filingDate"
          value={form.filingDate}
          onChange={handleChange}
        />
      </label>
      <label>
        Tax Payable (after TDS etc.):
        <input
          type="number"
          name="taxPayable"
          value={form.taxPayable}
          onChange={handleChange}
        />
      </label>
      <label>
        Paid on 15-Jun:
        <input
          type="number"
          name="paidJun"
          value={form.paidJun}
          onChange={handleChange}
        />
      </label>
      <label>
        Paid on 15-Sep:
        <input
          type="number"
          name="paidSep"
          value={form.paidSep}
          onChange={handleChange}
        />
      </label>
      <label>
        Paid on 15-Dec:
        <input
          type="number"
          name="paidDec"
          value={form.paidDec}
          onChange={handleChange}
        />
      </label>
      <label>
        Paid on 15-Mar:
        <input
          type="number"
          name="paidMar"
          value={form.paidMar}
          onChange={handleChange}
        />
      </label>
      <label>
        <b>Advance Tax Paid:</b>
        <input type="number" value={advanceTaxPaid} readOnly />
      </label>
      <label>
        <b>Total Remaining Tax Liability:</b>
        <input type="number" value={totalRemainingTaxLiability} readOnly />
      </label>
      <button type="submit">Calculate Interest</button>
    </form>
  );
}

export default AdvanceTaxCalculator;
