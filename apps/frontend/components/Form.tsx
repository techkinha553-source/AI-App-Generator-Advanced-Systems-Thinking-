import React from "react";

type FormProps = {
  fields?: string[];
  table: string;
  children?: React.ReactNode;
};

export default function Form({ fields = [], table, children }: FormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    await fetch(`http://localhost:5050/api/${table}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((f) => (
        <input key={f} name={f} placeholder={f} />
      ))}
      <button type="submit">Submit</button>
      {children && <div>{children}</div>}
    </form>
  );
}