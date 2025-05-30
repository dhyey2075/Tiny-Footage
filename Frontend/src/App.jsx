import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');

   const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !email) {
      alert('Please provide both file and email');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      console.log('✅ Response:', data);
      alert('Upload successful! File will be processed and you will receive an email with the download link.');
      setFile(null);
      setEmail(''); 
    } catch (error) {
      console.error('❌ Upload failed:', error);
    }
  };

  return (
    <>
      <h1>Tiny Footage</h1>

      <h4>Enter email to get the video download link</h4>
      <form onSubmit={handleSubmit} className="upload-form">
      <label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </label>

      <br />

      <h4>
        <label>
        File:
        <input type="file" onChange={e => setFile(e.target.files[0])} required />
      </label>
      </h4>
      <br />

      <button type="submit">Upload</button>
    </form>
    </>
  )
}

export default App
