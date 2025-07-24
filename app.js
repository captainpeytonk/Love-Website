import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [topic, setTopic] = useState("");
  const [conversation, setConversation] = useState([]);
  const [currentVoice, setCurrentVoice] = useState('voice1');
  const audioRef = useRef(null);

  async function sendMessage() {
    if (!topic.trim()) return;

    const res = await fetch('http://localhost:4000/talk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, fromVoice: currentVoice }),
    });
    const data = await res.json();

    setConversation(prev => [...prev, { speaker: currentVoice, text: data.text, audioUrl: data.audioUrl }]);
    setTopic("");

    // Play audio
    if (audioRef.current) {
      audioRef.current.src = data.audioUrl;
      audioRef.current.play();
    }

    // Switch voice for next message
    setCurrentVoice(currentVoice === 'voice1' ? 'voice2' : 'voice1');
  }

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '1rem' }}>
      <h1>AI Voices Conversation</h1>

      <div style={{ minHeight: '300px', border: '1px solid #ccc', padding: '1rem', overflowY: 'auto' }}>
        {conversation.map((msg, i) => (
          <div key={i} style={{ marginBottom: '1rem', textAlign: msg.speaker === 'voice1' ? 'left' : 'right' }}>
            <b>{msg.speaker}:</b> {msg.text}
          </div>
        ))}
      </div>

      <input
        type="text"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="Enter topic or prompt"
        style={{ width: '80%', padding: '0.5rem' }}
      />
      <button onClick={sendMessage} style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}>Send</button>

      <audio ref={audioRef} controls hidden />
    </div>
  );
}

export default App;
