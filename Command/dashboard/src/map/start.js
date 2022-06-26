import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './start.css'
import _ from 'underscore';
import Map from './map'
import Input from '../controls/inputs'
import { Spin } from 'antd';
import { CheckCircleTwoTone, SyncOutlined } from '@ant-design/icons'
const Start = () => {

  const [pos, setpos] = useState(0)
  const [clearrover, setclearrover] = useState(0)
  const [status, setstatus] = useState("Awaiting Command...")

  useEffect(() => {
    setTimeout(() => [
      setclearrover(0)
    ], 1000)
  }, [clearrover])

  const setpos1 = async () => {
    try {
      await axios.post('http://localhost:5000/data/commands', {
        type: 'position',
        input: 1,
        speed: ''
      })
    } catch (error) {
      console.log(error)
    }
    setpos(1)
  }
  const setpos2 = async () => {
    try {
      await axios.post('http://localhost:5000/data/commands', {
        type: 'position',
        input: 2,
        speed: ''
      })
    } catch (error) {
      console.log(error)
    }
    setpos(2)
  }
  const setpos3 = async () => {
    try {
      await axios.post('http://localhost:5000/data/commands', {
        type: 'position',
        input: 3,
        speed: ''
      })
    } catch (error) {
      console.log(error)
    }
    setpos(3)
  }
  const setpos4 = async () => {
    try {
      await axios.post('http://localhost:5000/data/commands', {
        type: 'position',
        input: 4,
        speed: ''
      })
    } catch (error) {
      console.log(error)
    }
    setpos(4)
  }

  return (
    <div className='startscreen'>
      <div className='daInput'>
        <div id='titwrap'>
          <h1 className="title">Welcome to the Mars Rover Command Centre</h1>
        </div>
        <Input Pos={pos} changepos={setpos} setclearRover={setclearrover} changestat={setstatus} />
        <div className='statusdisp' id={status === "Awaiting Command..." ? 'wait' : 'do'}>
          <div className='statusMsg'>{status}</div>
          <div className='animation' id={status === "Awaiting Command..." ? 'nosee' : null}><SyncOutlined spin /></div>
          <div className='animation' id={status !== "Awaiting Command..." ? 'nosee' : null}><CheckCircleTwoTone twoToneColor="#52c41a" /></div>
        </div>
      </div>
      <div className="FullMap">
        <div className={pos !== 0 ? 'show' : 'hidden'}>
          <h3 id='startmsg'>Please select starting corner</h3>
          <div className='corners'>
            <div className='corner1'>
              <button className='butts' onClick={setpos1}>
                <div className='buttName'>1</div>
              </button>
            </div>
            <div className='corner2'>
              <button className='butts' onClick={setpos2}>
                <div className='buttName'>2</div>
              </button >
            </div>
            <div className='corner3'>
              <button className='butts' onClick={setpos3}>
                <div className='buttName'>3</div>
              </button>
            </div>
            <div className='corner4'>
              <button className='butts' onClick={setpos4}>
                <div className='buttName'>4</div>
              </button>
            </div>
          </div>
        </div>
        <div className="daMap">
          <Map Pos={pos} roverclear={clearrover} />
        </div>
      </div>


    </div>

  )
}
export default Start
