import React, { useState, useEffect, useRef} from 'react';
import { useReactToPrint } from 'react-to-print';
const Tracker = () => {
  const [entries, setEntries] = useState(() => JSON.parse(localStorage.getItem('entries')) || []);
  const [item, setItem] = useState({ name: '', amount: '', type: 'sale' });

  const [summary, setSummary] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('entries', JSON.stringify(entries));
  }, [entries]);

  const handleClearEntries = () => {
    setEntries([]);
    localStorage.removeItem('smartbiz-entries');
  };


  const handleAdd = e => {
    e.preventDefault();
    if (!item.name || !item.amount) return;
    const updated = [...entries, { ...item, amount: parseFloat(item.amount) }];
    setEntries(updated);
    setItem({ name: '', amount: '', type: 'sale' });
  };

  const calculate = () => {
    let sales = 0, expenses = 0;
    entries.forEach(e => e.type === 'sale' ? sales += e.amount : expenses += e.amount);
    return { sales, expenses, profit: sales - expenses };
  };


  const generateAIAdvice = async () => {
    setLoading(true);
    setSummary('');
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [{
            role: "user",
            content: `You're a business analyst helping small business owners. Analyze the following sales and expense records and generate:
                    1. A brief summary of today's financial activity.
                    2. Key observations (e.g. most frequent expenses or top-selling items).
                    3. Total sales, expenses, and profit.
                    4. Advice or recommendations to improve future performance.
                    Here is the data: ${JSON.stringify(entries)}`
          }]
        })
      });

      if (!response.ok) {
        throw new Error (`Error: ${response.statusText}`);
    }

      const data = await response.json();
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
      setSummary(data.choices[0].message.content);
    } else {
      throw new Error("Invalid AI response structure.");
    }
    } 
    
    
    catch (error) {
      console.error("Error generating summary:", error);
      setSummary('⚠️ Sorry, something went wrong while generating the AI report. Please check your internet connection or try again later..');
    } 
    finally {
      setLoading(false);
    }
  
  };


  const { sales, expenses, profit } = calculate();
  const Receipt = React.forwardRef(({ entries }, ref) => (
    <div ref={ref} className="receipt">
      <h2>Receipt</h2>
      <ul>
        {entries.map((entry, index) => (
          <li key={index}>{entry.type.toUpperCase()}: {entry.name} - ₦{entry.amount}</li>
        ))}
      </ul>
      </div>
  ));

const receiptRef = useRef();
  const handlePrint = () => {
    if (!receiptRef.current) {
        alert("Receipt not ready to print.");
        return;
    };
    printReceipt();
};

const printReceipt = useReactToPrint({
    content: () => receiptRef.current,
})



  return (
    <div className="page">
      <h2>My Business Tracker</h2>
      <form onSubmit={handleAdd} className="form">
        <input type="text" value={item.name} onChange={e => setItem({ ...item, name: e.target.value })} placeholder="Item name" required />
        <input type="number" value={item.amount} onChange={e => setItem({ ...item, amount: e.target.value })} placeholder="Amount" required />
        <select value={item.type} onChange={e => setItem({ ...item, type: e.target.value })}>
          <option value="sale">Sale</option>
          <option value="expense">Expense</option>
        </select>
        <button type="submit">Add</button>
      </form>
      <div className="summary">
        <p>Total Sales: ₦{sales.toFixed(2)}</p>
        <p>Total Expenses: ₦{expenses.toFixed(2)}</p>
        <p><strong>Profit: ₦{profit.toFixed(2)}</strong></p>
      </div>


      
      <button onClick={generateAIAdvice} disabled={loading}>{loading ? 'Generating...' : 'Get AI Advice'}</button>
      {summary && <div className="ai-summary"><h4>AI Summary</h4><p>{summary}</p></div>}
    

    <button onClick={handleClearEntries} className="clear-button">
        Clear All Entries
      </button>
      <Receipt ref={receiptRef} entries={entries} />
      <button onClick={handlePrint} className="print-button">
        Print Receipt
      </button>
    
    </div>
    
  
);
};

export default Tracker;


