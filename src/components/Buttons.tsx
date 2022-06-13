import React from 'react';
import Button from '@mui/material/Button';

export default function Buttons() {
  return (
    <div className="Buttons">
      <header className="App-header">
        <Button variant="contained" onClick={() => { alert('clicked'); }}>Hello World 5</Button>
      </header>
    </div>
  );
}
