import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:4000';

function App() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load from localStorage first, then from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const cached = localStorage.getItem("users");
      if (cached) {
        setUsers(JSON.parse(cached));
      }

      const res = await axios.get(`${API}/users`);
      setUsers(res.data);
      localStorage.setItem("users", JSON.stringify(res.data));
    } catch (error) {
      alert('Failed to fetch users: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email) {
      alert('Please fill all fields');
      return;
    }
    if (!isValidEmail(form.email)) {
      alert('Please enter a valid email');
      return;
    }
    setLoading(true);
    try {
      if (editId === null) {
        await axios.post(`${API}/users`, form);
      } else {
        await axios.put(`${API}/users/${editId}`, form);
        setEditId(null);
      }
      setForm({ name: '', email: '' });
      const res = await axios.get(`${API}/users`);
      setUsers(res.data);
      localStorage.setItem("users", JSON.stringify(res.data));
    } catch (error) {
      alert('Error saving user: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = user => {
    setEditId(user.id);
    setForm({ name: user.name, email: user.email });
  };

  const handleDelete = async id => {
    if (window.confirm('Delete user?')) {
      setLoading(true);
      try {
        await axios.delete(`${API}/users/${id}`);
        const res = await axios.get(`${API}/users`);
        setUsers(res.data);
        localStorage.setItem("users", JSON.stringify(res.data));
      } catch (error) {
        alert('Error deleting user: ' + (error.response?.data?.error || error.message));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <style>{`
        body {
          font-family: Arial, sans-serif;
          background: #f9faff;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background: white;
          padding: 25px 30px;
          border-radius: 8px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }
        h1 {
          text-align: center;
          color: #1a73e8;
          margin-bottom: 25px;
        }
        form {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        input {
          flex: 1;
          padding: 8px 12px;
          border: 1.5px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
          transition: border-color 0.3s ease;
        }
        input:focus {
          border-color: #1a73e8;
          outline: none;
        }
        button {
          background-color: #1a73e8;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        button:hover {
          background-color: #155ab6;
        }
        button:disabled {
          background-color: #a3c0f9;
          cursor: not-allowed;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 12px 8px;
          border-bottom: 1px solid #ddd;
          text-align: left;
        }
        th {
          background-color: #e8f0fe;
          color: #1a73e8;
        }
        tr:hover {
          background-color: #f1f5fb;
        }
        .actions button {
          margin-right: 8px;
          background-color: #1a73e8;
          font-size: 14px;
          padding: 5px 10px;
          border-radius: 4px;
        }
        .actions button:last-child {
          background-color: #d93025;
        }
        .actions button:hover {
          opacity: 0.9;
        }
        .loading-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(255, 255, 255, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
        .spinner {
          border: 6px solid #f3f3f3;
          border-top: 6px solid #1a73e8;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>

      <div className="container">
        <h1>User CRUD with React + Node + Neon</h1>

        <form onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {editId === null ? 'Add' : 'Update'}
          </button>
          {editId !== null && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm({ name: '', email: '' });
              }}
              disabled={loading}
              style={{ backgroundColor: '#555', marginLeft: '10px' }}
            >
              Cancel
            </button>
          )}
        </form>

        {loading && (
          <div className="loading-overlay" aria-label="Loading">
            <div className="spinner"></div>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>S/NO</th><th>Name</th><th>Email</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No users found</td></tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td className="actions">
                    <button onClick={() => handleEdit(user)} disabled={loading}>Edit</button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={loading}
                      style={{ backgroundColor: '#d93025' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default App;
