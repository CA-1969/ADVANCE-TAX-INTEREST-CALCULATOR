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

  const advanceTaxPaid =
    (parseFloat(form.paidJun) || 0) +
    (parseFloat(form.paidSep) || 0) +
    (parseFloat(form.paidDec) || 0) +
    (parseFloat(form.paidMar) || 0);

  const totalRemainingTaxLiability =
    (parseFloat(form.taxPayable) || 0) - advanceTaxPaid;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form autoComplete="off">
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
        Advance Tax Paid:
        <input type="number" value={advanceTaxPaid} readOnly />
      </label>
      <label>
        Total Remaining Tax Liability:
        <input type="number" value={totalRemainingTaxLiability} readOnly />
      </label>
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
      <button type="submit">Calculate Interest</button>
    </form>
  );
}

export default AdvanceTaxCalculator;
