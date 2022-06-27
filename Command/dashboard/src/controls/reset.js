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

  const resetAuto = async () => {
    try {
      await axios.post('http://localhost:5000/data', {
        type: 'auto',
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
    resetAuto();
  }


  return (
    <div className='reset'>
        <button id='resetbutt' onClick={multiRESET}>
            <div id='name'>HARD RESET</div>
        </button>
    </div>
  );
}

export default Reset;