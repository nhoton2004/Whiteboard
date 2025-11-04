// Auth component: register / login
import React, { useState } from 'react';

const API = 'http://localhost:5000';

export default function Auth({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roomId, setRoomId] = useState('room-demo'); // default room

  async function submit(e) {
    e.preventDefault();
    try {
      const url = isLogin ? '/login' : '/register';
      const res = await fetch(API + url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'Error');
      if (isLogin) {
        onAuth(data.token, username);
        // store room choice in localStorage for whiteboard
        localStorage.setItem('roomId', roomId);
      } else {
        alert('Registered. Now login.');
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="auth">
      <h3>{isLogin ? 'Login' : 'Register'}</h3>
      <form onSubmit={submit}>
        <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} required />
        <input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <div style={{marginTop:8}}>
          <label>Room ID:</label>
          <input value={roomId} onChange={e=>setRoomId(e.target.value)} />
        </div>
        <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
      </form>
      <div style={{marginTop:8}}>
        <button onClick={()=>setIsLogin(!isLogin)}>{isLogin ? 'Go to Register' : 'Go to Login'}</button>
      </div>
    </div>
  );
}
