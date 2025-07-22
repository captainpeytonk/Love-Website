function speak() {
  const text = document.getElementById('text').value;
  fetch('http://localhost:5000/speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  .then(res => res.json())
  .then(data => {
    const audio = document.getElementById('audio');
    audio.src = data.url;
    audio.style.display = 'block';
    audio.play();
  })
  .catch(err => console.error(err));
}
