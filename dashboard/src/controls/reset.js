import React, { useState } from 'react'
import axios from 'axios'
import './reset.css'

const Reset = () => {

  const resetAlien = async () => {
    try {
      await axios.post('http://localhost:5000/data', {
        type: 'aliens',
      })
    } catch (error) {
      console.log(error)
    }
    return;
  }

  const resetLocation = async () => {
    try {
      await axios.post('http://localhost:5000/data', {
        type: 'location',
      })
    } catch (error) {
      console.log(error)
    }
    return;
  }

  const resetCommands = async () => {
    try {
      await axios.post('http://localhost:5000/data', {
        type: 'commands',
      })
    } catch (error) {
      console.log(error)
    }
    return;
  }

  const multiRESET = () => {
    resetCommands();
    resetAlien();
    resetLocation();
  }


  return (
    <div className='reset'>
        <button id='resetbutt' onClick={multiRESET}>
            <h4>HARD RESET</h4>
        </button>
    </div>
  );
}

export default Reset;