import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { RedoOutlined, UndoOutlined, DragOutlined, CaretUpOutlined, CaretDownOutlined, VerticalAlignBottomOutlined, VerticalAlignTopOutlined, BorderlessTableOutlined } from '@ant-design/icons';
import './controls.css'
import { message } from 'antd';


const Cont = ({ Inputs, Position, setStat }) => {
  const [initpos, setinitpos] = useState()
  const [autodata, setautodata] = useState([])
  const [autoID, setautoID] = useState([])
  const [autopath, setautopath] = useState([])
  const [info, setInfo] = useState([])
  const [commandBuffer, setcommandBuffer] = useState([])

  //const commandBufferref = useRef(commandBuffer)
  const [callback, setcallback] = useState(1)
  const [obstacleinfo, setobstacleinfo] = useState([])
  const [obstacles, setobstacles] = useState([])
  const [obstaclesize, setobstaclesize] = useState([])
  // const [status, setStatus]=useState("Awaiting command...")
  const [statuscheck, setstatuscheck] = useState(1)
  const [isauto, setisAuto] = useState(false)
  const [isautosweep, setisautosweep]=useState(false)
  const [timer, settimer] = useState(0)
  const [timer2, settimer2] = useState(0)
  const [nextCoords, setnextCoords] = useState({ "x": 0, "y": 0 })
  const [restart, setrestart] = useState(0)
  const inforef = useRef(info)
  const angleref = useRef(info[0]?.angle)

  useEffect(() => {
    console.log("pos is " + Position)
    if (Position === 1) {
      setinitpos(1)
    }
    else if (Position === 2) {
      setinitpos(2)
    }
    else if (Position === 3) {
      setinitpos(2)
    }
    else if (Position === 4) {
      setinitpos(1)
    }
    else { setinitpos("Undefined"); return; }
  }, [Position])


  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/data/aliens')
        setobstacleinfo(res.data)
        console.log(res.data)
      } catch (error) {
        console.log(error)
      }
    }
    fetchData()
    const interval = setInterval(() => {
      fetchData()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (obstacleinfo.length === 0) {
      setobstacles([])
      setobstaclesize([])
      return;
    }
    if (obstacleinfo[0]) {
      if (obstacleinfo[0].type !== "fan") {
        if (obstacles.some(item => (/*obstacle.Location.x*/obstacleinfo[0].Location.x < item.x + 5) && (item.x - 5 < obstacleinfo[0].Location.x/*obstacle.Location.x*/) && (/*obstacle.Location.y*/obstacleinfo[0].Location.y < item.y + 5) && (item.y - 5 < /*obstacle.Location.y*/obstacleinfo[0].Location.y))) {
          //console.log("already used alien coord")
        }
        else {
          setobstacles(prevdataAlien => [...prevdataAlien, obstacleinfo[0].Location])
          setobstaclesize(prevsize => [...prevsize, obstacleinfo[0].size])
        }
      }
      else { return; }
    }

  }, [obstacleinfo])


  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/data/location')
        setInfo(res.data)
        console.log(res.data)
      } catch (error) {
        console.log(error)
      }
    }
    fetchData()
    const interval = setInterval(() => {
      fetchData()
    }, 1000)

    return () => clearInterval(interval)

  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/data/auto')
        setautodata(res.data)
        console.log(res.data)
      } catch (error) {
        console.log(error)
      }
    }
    fetchData()
    const interval = setInterval(() => {
      fetchData()
    }, 1000)

    return () => clearInterval(interval)

  }, [])

  useEffect(() => {
    if (info[0]) {
      if (info[0].finished === 1) {
        setstatuscheck(1)
        setStat("Awaiting Command...")
      }
      else {
        setstatuscheck(0)
        setStat("Executing...")
      }
    }
  }, [info])

  const sendForward = async () => {
    if (statuscheck === 0 || !info[0]) {
      return;
    }
    if (!Inputs[3]) {
      console.log("no speed input")
      warningSpeed()
    }
    if (Inputs[0] === 0) {
      warningDistAngle()
    }
    var newX;
    var newY;

    if (info[0].angle <= 90) {
      newX = Inputs[0] * Math.cos(info[0].angle * (Math.PI / 180)) + info[0].Location.x
      newY = Inputs[0] * Math.sin(info[0].angle * (Math.PI / 180)) + info[0].Location.y
    }
    else if (info[0].angle <= 180 && info[0].angle > 90) {
      newX = -Inputs[0] * Math.sin((info[0].angle - 90) * (Math.PI / 180)) + info[0].Location.x
      newY = Inputs[0] * Math.cos((info[0].angle - 90) * (Math.PI / 180)) + info[0].Location.y
    }
    else if (info[0].angle <= 270 && info[0].angle > 180) {
      newX = -Inputs[0] * Math.sin((270 - info[0].angle) * (Math.PI / 180)) + info[0].Location.x
      newY = -Inputs[0] * Math.cos((270 - info[0].angle) * (Math.PI / 180)) + info[0].Location.y
    }
    else if (info[0].angle <= 360 && info[0].angle > 270) {
      newX = Inputs[0] * Math.sin((info[0].angle - 270) * (Math.PI / 180)) + info[0].Location.x
      newY = -Inputs[0] * Math.cos((info[0].angle - 270) * (Math.PI / 180)) + info[0].Location.y
    }

    if (initpos === 1) {
      if (newX > 0 || newX < -300 || newY < 0 || newY > 300) {
        errorCoords1()
        return;
      }
    }
    else if (initpos === 2) {
      if (newX < 0 || newX > 300 || newY > 300 || newY < 0) {
        console.log("will hit border!")
        errorCoords1()
        return;
      }
    }
    for (var i = 0; i < obstacles.length; i++) {
      if (obstacles[i].x > info[0].Location.x && obstacles[i].y > info[0].Location.y) {
        if (newX < obstacles[i].x - (15 + (obstaclesize[i] / 2)) || newY < obstacles[i].y - (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      else if (obstacles[i].x > info[0].Location.x && obstacles[i].y < info[0].Location.y) {
        if (newX < obstacles[i].x - (15 + (obstaclesize[i] / 2)) || newY > obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      else if (obstacles[i].x < info[0].Location.x && obstacles[i].y < info[0].Location.y) {
        if (newX > obstacles[i].x + (15 + (obstaclesize[i] / 2)) || newY > obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      else if (obstacles[i].x < info[0].Location.x && obstacles[i].y > info[0].Location.y) {
        if (newX > obstacles[i].x + (15 + (obstaclesize[i] / 2)) || newY < obstacles[i].y - (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      else if (obstacles[i].x === info[0].Location.x && obstacles[i].y > info[0].Location.y) {
        if (newY < obstacles[i].y - (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      else if (obstacles[i].x === info[0].Location.x && obstacles[i].y < info[0].Location.y) {
        if (newY > obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      else if (obstacles[i].y === info[0].Location.y && obstacles[i].x < info[0].Location.x) {
        if (newX > obstacles[i].x + (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      else if (obstacles[i].y === info[0].Location.y && obstacles[i].x > info[0].Location.x) {
        if (newX < obstacles[i].x - (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      var lineGrad = ((info[0].Location.y - newY) / (info[0].Location.x - newX))
      var lineIntercept = newY - (lineGrad * newX)
      if (((obstacles[i].y - (15 + (obstaclesize[i] / 2)) - lineIntercept) / lineGrad) > obstacles[i].x - (15 + (obstaclesize[i] / 2)) && ((obstacles[i].y - (15 + (obstaclesize[i] / 2)) - lineIntercept) / lineGrad) < obstacles[i].x + (15 + (obstaclesize[i] / 2))) {
        console.log("IN A POINT RADIUS")
        errorCoords2()
        return;
      }
      else if (((obstacles[i].y + (15 + (obstaclesize[i] / 2)) - lineIntercept) / lineGrad) > obstacles[i].x - (15 + (obstaclesize[i] / 2)) && ((obstacles[i].y - (15 + (obstaclesize[i] / 2)) - lineIntercept) / lineGrad) < obstacles[i].x + (15 + (obstaclesize[i] / 2))) {
        console.log("IN A POINT RADIUS")
        errorCoords2()
        return;
      }
      else if ((((obstacles[i].x - (15 + (obstaclesize[i] / 2))) * lineGrad) + lineIntercept) > obstacles[i].y - (15 + (obstaclesize[i] / 2)) && (((obstacles[i].x - (15 + (obstaclesize[i] / 2))) * lineGrad) + lineIntercept) < obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
        console.log("IN A POINT RADIUS")
        errorCoords2()
        return;
      }
      else if ((((obstacles[i].x + (15 + (obstaclesize[i] / 2))) * lineGrad) + lineIntercept) > obstacles[i].y - (15 + (obstaclesize[i] / 2)) && (((obstacles[i].x + (15 + (obstaclesize[i] / 2))) * lineGrad) + lineIntercept) < obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
        console.log("IN A POINT RADIUS")
        errorCoords2()
        return;
      }
    }

    try {
      await axios.post('http://localhost:5000/data/commands', {
        type: 'forward',
        input: Inputs[0],
        speed: Inputs[3] ? Inputs[3] : 'Normal',
      })
    } catch (error) {
      console.log(error)
    } finally {
      success()
    }
  }


  const sendBackward = async () => {
    if (statuscheck === 0 || !info[0]) {
      return;
    }
    if (!Inputs[3]) {
      console.log("no speed input")
      warningSpeed()
    }

    if (Inputs[0] === 0) {
      warningDistAngle()
    }

    var newX;
    var newY;

    if (info[0].angle <= 90) {
      newX = -Inputs[0] * Math.cos(info[0].angle * (Math.PI / 180)) + info[0].Location.x
      newY = -Inputs[0] * Math.sin(info[0].angle * (Math.PI / 180)) + info[0].Location.y
    }
    else if (info[0].angle <= 180 && info[0].angle > 90) {
      newX = Inputs[0] * Math.sin((info[0].angle - 90) * (Math.PI / 180)) + info[0].Location.x
      newY = -Inputs[0] * Math.cos((info[0].angle - 90) * (Math.PI / 180)) + info[0].Location.y
    }
    else if (info[0].angle <= 270 && info[0].angle > 180) {
      newX = Inputs[0] * Math.sin((270 - info[0].angle) * (Math.PI / 180)) + info[0].Location.x
      newY = Inputs[0] * Math.cos((270 - info[0].angle) * (Math.PI / 180)) + info[0].Location.y
    }
    else if (info[0].angle <= 360 && info[0].angle > 270) {
      newX = -Inputs[0] * Math.sin((info[0].angle - 270) * (Math.PI / 180)) + info[0].Location.x
      newY = Inputs[0] * Math.cos((info[0].angle - 270) * (Math.PI / 180)) + info[0].Location.y
    }

    if (initpos === 1) {
      if (newX > 0 || newX < -300 || newY < 0 || newY > 300) {
        errorCoords1()
        return;
      }
    }
    else if (initpos === 2) {
      if (newX < 0 || newX > 300 || newY > 300 || newY < 0) {
        console.log("will hit border!")
        errorCoords1()
        return;
      }
    }
    for (var i = 0; i < obstacles.length; i++) {
      if (obstacles[i].x > info[0].Location.x && obstacles[i].y > info[0].Location.y) {
        if (newX < obstacles[i].x - (15 + (obstaclesize[i] / 2)) || newY < obstacles[i].y - (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      else if (obstacles[i].x > info[0].Location.x && obstacles[i].y < info[0].Location.y) {
        if (newX < obstacles[i].x - (15 + (obstaclesize[i] / 2)) || newY > obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      else if (obstacles[i].x < info[0].Location.x && obstacles[i].y < info[0].Location.y) {
        if (newX > obstacles[i].x + (15 + (obstaclesize[i] / 2)) || newY > obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      else if (obstacles[i].x < info[0].Location.x && obstacles[i].y > info[0].Location.y) {
        if (newX > obstacles[i].x + (15 + (obstaclesize[i] / 2)) || newY < obstacles[i].y - (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      else if (obstacles[i].x === info[0].Location.x && obstacles[i].y > info[0].Location.y) {
        if (newY < obstacles[i].y - (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      else if (obstacles[i].x === info[0].Location.x && obstacles[i].y < info[0].Location.y) {
        if (newY > obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      else if (obstacles[i].y === info[0].Location.y && obstacles[i].x < info[0].Location.x) {
        if (newX > obstacles[i].x + (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      else if (obstacles[i].y === info[0].Location.y && obstacles[i].x > info[0].Location.x) {
        if (newX < obstacles[i].x - (15 + (obstaclesize[i] / 2))) {
          console.log("ACCEPTABLE PLACE")
          continue;
        }
      }
      var lineGrad = ((info[0].Location.y - newY) / (info[0].Location.x - newX))
      var lineIntercept = newY - (lineGrad * newX)
      if (((obstacles[i].y - (15 + (obstaclesize[i] / 2)) - lineIntercept) / lineGrad) > obstacles[i].x - (15 + (obstaclesize[i] / 2)) && ((obstacles[i].y - (15 + (obstaclesize[i] / 2)) - lineIntercept) / lineGrad) < obstacles[i].x + (15 + (obstaclesize[i] / 2))) {
        console.log("IN A POINT RADIUS")
        errorCoords2()
        return;
      }
      else if (((obstacles[i].y + (15 + (obstaclesize[i] / 2)) - lineIntercept) / lineGrad) > obstacles[i].x - (15 + (obstaclesize[i] / 2)) && ((obstacles[i].y - (15 + (obstaclesize[i] / 2)) - lineIntercept) / lineGrad) < obstacles[i].x + (15 + (obstaclesize[i] / 2))) {
        console.log("IN A POINT RADIUS")
        errorCoords2()
        return;
      }
      else if ((((obstacles[i].x - (15 + (obstaclesize[i] / 2))) * lineGrad) + lineIntercept) > obstacles[i].y - (15 + (obstaclesize[i] / 2)) && (((obstacles[i].x - (15 + (obstaclesize[i] / 2))) * lineGrad) + lineIntercept) < obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
        console.log("IN A POINT RADIUS")
        errorCoords2()
        return;
      }
      else if ((((obstacles[i].x + (15 + (obstaclesize[i] / 2))) * lineGrad) + lineIntercept) > obstacles[i].y - (15 + (obstaclesize[i] / 2)) && (((obstacles[i].x + (15 + (obstaclesize[i] / 2))) * lineGrad) + lineIntercept) < obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
        console.log("IN A POINT RADIUS")
        errorCoords2()
        return;
      }
    }

    try {
      await axios.post('http://localhost:5000/data/commands', {
        type: 'backward',
        input: Inputs[0],
        speed: Inputs[3],
      })
    } catch (error) {
      console.log(error)
    } finally {
      success()
    }
  }


  const sendRanticw = async () => {
    if (statuscheck === 0) {
      return;
    }
    if (Inputs[1] === 0) {
      warningDistAngle()
    }
    //const newIntervalId = setInterval(async() => {
    //setCommand(command => command + 1);
    try {
      await axios.post('http://localhost:5000/data/commands', {
        type: 'rotateACW',
        input: Inputs[1],
        speed: ''
      })
    } catch (error) {
      console.log(error)
    } finally {
      success()
    }

  }

  const sendRcw = async () => {
    if (statuscheck === 0) {
      return;
    }
    if (Inputs[1] === 0) {
      warningDistAngle()
    }
    try {
      await axios.post('http://localhost:5000/data/commands', {
        type: 'rotateCW',
        input: Inputs[1],
        speed: ''
      })
    } catch (error) {
      console.log(error)
    } finally {
      success()
    }
  }

  const goto = async () => {
    if (statuscheck === 0) {
      return;
    }

    if (initpos === 1) {
      if (Inputs[2].x > 0 || Inputs[2].x < -300 || Inputs[2].y < 0 || Inputs[2].y > 300) {
        console.log("will hit border!")
        errorCoords1()
        return;
      }
    }
    else if (initpos === 2) {
      if (Inputs[2].x < 0 || Inputs[2].x > 300 || Inputs[2].y > 300 || Inputs[2].y < 0) {
        console.log("will hit border!")
        errorCoords1()
        return;
      }
    }

    for (var i = 0; i < obstacles.length; i++) {
      if (Inputs[2].x > obstacles[i].x - (15 + (obstaclesize[i] / 2)) && Inputs[2].x < obstacles[i].x + (15 + (obstaclesize[i] / 2)) && Inputs[2].y > obstacles[i].y - (15 + (obstaclesize[i] / 2)) && Inputs[2].y < obstacles[i].x + (15 + (obstaclesize[i] / 2))) {
        console.log("Point is in an obstacle radius")
        errorCoords2()
        return;
      }
    }

    try {
      // console.log("INPUT IS: "+ JSON.stringify(Inputs[2]))
      await axios.post('http://localhost:5000/data/commands', {
        type: 'goto',
        input: Inputs[2],
        speed: ''
      })
    } catch (error) {
      console.log(error)
    } finally {
      success()
    }
  }

  const success = () => {
    message.success({ content: 'Command Sent', duration: 2, style: { fontWeight: "bold", fontFamily: "Tahoma, sans-serif" } });
  };

  const warningSpeed = () => {
    message.warning({ content: 'Undefined Speed... Using Default', duration: 2, style: { fontWeight: "bold", fontFamily: "Tahoma, sans-serif" } });
  };
  const warningDistAngle = () => {
    message.warning({ content: 'Input is 0', duration: 2, style: { fontWeight: "bold", fontFamily: "Tahoma, sans-serif" } });
  };
  const errorCoords1 = () => {
    message.error({ content: 'Coords are out of bounds', duration: 2, style: { fontWeight: "bold", fontFamily: "Tahoma, sans-serif" } });
  };
  const errorCoords2 = () => {
    message.error({ content: 'Coords interfere with obstacle', duration: 2, style: { fontWeight: "bold", fontFamily: "Tahoma, sans-serif" } });
  };
  const infoEmergStop = () => {
    message.info({ content: 'Unexpected obstacle. Stopping.', duration: 2, style: { fontWeight: "bold", fontFamily: "Tahoma, sans-serif" } });
  };
  const infoFinishedAuto = () => {
    message.info({ content: 'Automated Sweep has completed.', duration: 2, style: { fontWeight: "bold", fontFamily: "Tahoma, sans-serif" } });
  };

  useEffect(() => {
    if (isauto === true) {
      if (statuscheck === 0) {
        setisAuto(false)
        return;
      }
      if (!info[0]) {
        setnextCoords({ "x": 0, "y": 0 })

        success()

      }
      else { setnextCoords(info[0].Location) }
    }
  }, [isauto])

  useEffect(() => {
    if (isauto === true) {
      const Automate = async () => {
        if (statuscheck === 0) {
          console.log("EXECUTING STILL... WAITING")
          if (restart === 0) { setrestart(1) }
          else { setrestart(0) }
          return;
        }
        var newX;
        var newY;
        console.log("AUTO FUNC STARTING AT: " + JSON.stringify(nextCoords))
        var angle = Math.floor(Math.random() * (361));
        if (angle <= 90) {
          newX = 30 * Math.cos(angle * (Math.PI / 180)) + nextCoords.x
          newY = 30 * Math.sin(angle * (Math.PI / 180)) + nextCoords.y
        }
        else if (angle <= 180 && angle > 90) {
          newX = -30 * Math.sin((angle - 90) * (Math.PI / 180)) + nextCoords.x
          newY = 30 * Math.cos((angle - 90) * (Math.PI / 180)) + nextCoords.y
        }
        else if (angle <= 270 && angle > 180) {
          newX = -30 * Math.sin((270 - angle) * (Math.PI / 180)) + nextCoords.x
          newY = -30 * Math.cos((270 - angle) * (Math.PI / 180)) + nextCoords.y
        }
        else if (angle <= 360 && angle > 270) {
          newX = 30 * Math.sin((angle - 270) * (Math.PI / 180)) + nextCoords.x
          newY = -30 * Math.cos((angle - 270) * (Math.PI / 180)) + nextCoords.y
        }
        console.log("newX: " + newX)
        console.log("newY: " + newY)

        if (initpos === 1) {
          if (newX > 0 || newX < -300 || newY < 0 || newY > 300) {
            if (restart === 0) { setrestart(1) }
            else { setrestart(0) }
            return;
          }
        }
        else if (initpos === 2) {
          if (newX < 0 || newX > 300 || newY > 300 || newY < 0) {
            if (restart === 0) { setrestart(1) }
            else { setrestart(0) }
            return;
          }
        }

        for (var i = 0; i < obstacles.length; i++) {

          if (obstacles[i].x > nextCoords.x && obstacles[i].y > nextCoords.y) {
            if (newX < obstacles[i].x - (15 + (obstaclesize[i] / 2)) || newY < obstacles[i].y - (15 + (obstaclesize[i] / 2))) {
              console.log("ACCEPTABLE PLACE")
              continue;
            }
          }
          else if (obstacles[i].x > nextCoords.x && obstacles[i].y < nextCoords.y) {
            if (newX < obstacles[i].x - (15 + (obstaclesize[i] / 2)) || newY > obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
              console.log("ACCEPTABLE PLACE")
              continue;
            }
          }
          else if (obstacles[i].x < nextCoords.x && obstacles[i].y < nextCoords.y) {
            if (newX > obstacles[i].x + (15 + (obstaclesize[i] / 2)) || newY > obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
              console.log("ACCEPTABLE PLACE")
              continue;
            }
          }
          else if (obstacles[i].x < nextCoords.x && obstacles[i].y > nextCoords.y) {
            if (newX > obstacles[i].x + (15 + (obstaclesize[i] / 2)) || newY < obstacles[i].y - (15 + (obstaclesize[i] / 2))) {
              console.log("ACCEPTABLE PLACE")
              continue;
            }
          }
          else if (obstacles[i].x === nextCoords.x && obstacles[i].y > nextCoords.y) {
            if (newY < obstacles[i].y - (15 + (obstaclesize[i] / 2))) {
              console.log("ACCEPTABLE PLACE")
              continue;
            }
          }
          else if (obstacles[i].x === nextCoords.x && obstacles[i].y < nextCoords.y) {
            if (newY > obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
              console.log("ACCEPTABLE PLACE")
              continue;
            }
          }
          else if (obstacles[i].y === nextCoords.y && obstacles[i].x < nextCoords.x) {
            if (newX > obstacles[i].x + (15 + (obstaclesize[i] / 2))) {
              console.log("ACCEPTABLE PLACE")
              continue;
            }
          }
          else if (obstacles[i].y === nextCoords.y && obstacles[i].x > nextCoords.x) {
            if (newX < obstacles[i].x - (15 + (obstaclesize[i] / 2))) {
              console.log("ACCEPTABLE PLACE")
              continue;
            }
          }
          var lineGrad = ((nextCoords.y - newY) / (nextCoords.x - newX))
          var lineIntercept = newY - (lineGrad * newX)
          if (((obstacles[i].y - (15 + (obstaclesize[i] / 2)) - lineIntercept) / lineGrad) > obstacles[i].x - (15 + (obstaclesize[i] / 2)) && ((obstacles[i].y - (15 + (obstaclesize[i] / 2)) - lineIntercept) / lineGrad) < obstacles[i].x + (15 + (obstaclesize[i] / 2))) {
            console.log("IN A POINT RADIUS")
            if (restart === 0) { setrestart(1) }
            else { setrestart(0) }
            return;
          }
          else if (((obstacles[i].y + (15 + (obstaclesize[i] / 2)) - lineIntercept) / lineGrad) > obstacles[i].x - (15 + (obstaclesize[i] / 2)) && ((obstacles[i].y - (15 + (obstaclesize[i] / 2)) - lineIntercept) / lineGrad) < obstacles[i].x + (15 + (obstaclesize[i] / 2))) {
            console.log("IN A POINT RADIUS")
            if (restart === 0) { setrestart(1) }
            else { setrestart(0) }
            return;
          }
          else if ((((obstacles[i].x - (15 + (obstaclesize[i] / 2))) * lineGrad) + lineIntercept) > obstacles[i].y - (15 + (obstaclesize[i] / 2)) && (((obstacles[i].x - (15 + (obstaclesize[i] / 2))) * lineGrad) + lineIntercept) < obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
            console.log("IN A POINT RADIUS")
            if (restart === 0) { setrestart(1) }
            else { setrestart(0) }
            return;
          }
          else if ((((obstacles[i].x + (15 + (obstaclesize[i] / 2))) * lineGrad) + lineIntercept) > obstacles[i].y - (15 + (obstaclesize[i] / 2)) && (((obstacles[i].x + (15 + (obstaclesize[i] / 2))) * lineGrad) + lineIntercept) < obstacles[i].y + (15 + (obstaclesize[i] / 2))) {
            console.log("IN A POINT RADIUS")
            if (restart === 0) { setrestart(1) }
            else { setrestart(0) }
            return;
          }
        }

        console.log("Using angle: " + angle)
        setnextCoords(olddata => { return { "x": Math.round(newX), "y": Math.round(newY) } })
        //Coordinate is reachable...
        try {
          await axios.post('http://localhost:5000/data/location', {
            Location: { "x": Math.round(newX), "y": Math.round(newY) },
            angle: angle,
            finished: 1,
          })
        } catch (error) {
          console.log(error)
        }
        /*try {
          await axios.post('http://localhost:5000/data/commands', {
            type: 'rotateCW',
            input: angle,
            speed: ''
          })
        } catch (error) {
          console.log(error)
        }finally {
          try {
            await axios.post('http://localhost:5000/data/commands', {
              type: 'forward',
              input: 30,
              speed: 'Normal'
            })
          } catch (error) {
            console.log(error)
          }
        }*/
      }
      const newtimer = setTimeout(() => [
        Automate()
      ], 3000)
      settimer(newtimer);
      return () => { clearTimeout(timer) }
    }
  }, [nextCoords, restart])

  const backToBase = async () => {
    if (statuscheck === 0 && isauto === false) {
      return;
    }
    if (timer) {
      setisAuto(false)
      clearTimeout(timer)
      settimer(0)
    }
    try {
      await axios.post('http://localhost:5000/data/commands', {
        type: 'BackToBase',
        input: '',
        speed: ''
      })
    } catch (error) {
      console.log(error)
    } finally {
      success()
    }
  }

  useEffect(() => {
    if (info[0]) {
      if (info[0].finished === 0) {
        if (timer2 !== 0) {
          clearTimeout(timer2);
          settimer2(0);
          if (callback === 0) {
            setcallback(1)
          }
          else { setcallback(0) }
        }
      }
    }
  }, [info]);

  useEffect(() => { //sends commands in buffer
    console.log("commandBuffer length1: " + commandBuffer.length)
    console.log("RESTART USE EFFECT")
    const sendData = async () => {
      if (commandBuffer.length === 0) {
        console.log("commandBuffer length2: " + commandBuffer.length)
        console.log("ticking...")
        return;
      }
      const toSend = commandBuffer[0]
      var array = commandBuffer;
      array.splice(0, 1);
      console.log("NEW ARRAY: " + array)
      setcommandBuffer(array);
      if (callback === 0) {
        setcallback(1)
      }
      else { setcallback(0) }
      console.log("passes send return")
      try {
        await axios.post('http://localhost:5000/data/commands', toSend)
      } catch (error) {
        console.log(error)
      }finally{
        if(array.length===0){
          try {
            await axios.post('http://localhost:5000/data/commands', {
              type: 'Finished',
              input: '',
              speed: ''
            })
          } catch (error) {
            console.log(error)
          }
        }
      }
      
    }

    const newtimer2 = setTimeout(() => [
      sendData()
    ], 10000)
    settimer2(newtimer2);
    return () => { clearTimeout(timer2) }

  }, [commandBuffer, callback])

  useEffect(() => { inforef.current = info })
  useEffect(()=> { angleref.current = info[0]?.angle})

  useEffect(() => { //Handles setting commands from the pathfinding route
    if (!inforef.current[0]) { return; }
    console.log("Info exits")
    if (!autopath) { return }
    console.log("Func doesnt auto return")
    console.log(autopath)
    var commandlist = []
    var currLoc = { x: 0, y: 0 };
    var currAng = 90;
    for (var i = autopath.length - 1; i > -1; i--) {
      console.log("Entered for loop")
      
      if (i == autopath.length - 1) {
        currLoc = inforef.current[0]?.Location
        currAng = angleref.current
      }
      else { currLoc = autopath[i + 1]}

      var deltaX = autopath[i].x - currLoc.x;
      var deltaY = autopath[i].y - currLoc.y;

      while (autopath[i - 1] && autopath[i - 1].x - autopath[i].x == deltaX && autopath[i - 1].y - autopath[i].y == deltaY) {
        i -= 1;
      }
      var angleChange;

      if (autopath[i].x >= currLoc.x && autopath[i].y > currLoc.y) {
        angleChange = (180 / Math.PI) * Math.atan(deltaY / deltaX); //Upper right
      }
      else if (autopath[i].x < currLoc.x && autopath[i].y >= currLoc.y) {
        angleChange = (180 / Math.PI) * Math.atan(deltaY / deltaX); //Upper left
      }
      else if (autopath[i].x <= currLoc.x && autopath[i].y < currLoc.y) {
        angleChange = (180 / Math.PI) * Math.atan(deltaX / deltaY); //Bottom left
      }
      else if (autopath[i].x > currLoc.x && autopath[i].y <= currLoc.y) {
        angleChange = (180 / Math.PI) * Math.atan(deltaY / deltaX); //Bottom right
      }
      var distChange = Math.sqrt(Math.pow(autopath[i].y - currLoc.y, 2) + Math.pow(autopath[i].x - currLoc.x, 2))
      console.log("Angle to go: " + angleChange)
      console.log("Dist to go: " + distChange)
      


      var deltaAngle = angleChange - currAng;
      currAng = angleChange;
      if (deltaAngle < 0) {
        commandlist.push({
          type: 'rotateCW',
          input: Math.abs(deltaAngle),
          speed: ''
        })
      }
      else {
        commandlist.push({
          type: 'rotateACW',
          input: deltaAngle,
          speed: ''
        })
      }

      commandlist.push({
        type: 'forward',
        input: distChange,
        speed: 'Normal'
      })

    }
    setcommandBuffer(commandlist)
    return;
  }, [autopath])

  useEffect(() => { //Handles pathfinding route

    if (!autodata[0]) { return; }
    if (autoID.some(item => (item === autodata[0].ID))) { return; }
    else { setautoID(prevID => [...prevID, autodata[0].ID]); console.log("GOT AUTO POINTS") }
    if(autodata[0].stop===1){setisautosweep(false); if (timer) {
      setisAuto(false)
      clearTimeout(timer)
      settimer(0)
    }; if (timer2 !== 0) {
      clearTimeout(timer2);
      settimer2(0)}; infoEmergStop(); setcommandBuffer([]); return;}
    if(autodata[0].done===1){setisautosweep(false); infoFinishedAuto(); return;}

    const Astar = () => {

      var INT_MAX = Number.MAX_SAFE_INTEGER;

      var openList = [];
      var closedList = [];

      var start = new Array();
      start[0] = { x: autodata[0].start.x, y: autodata[0].start.y, f: 0, g: 0, h: 1800, parent: null }

      openList.push(start);

      var end = new Array();
      end[0] = { x: autodata[0].end.x, y: autodata[0].end.y, f: 0, g: 0, h: 0, parent: null }


      while (openList.length !== 0) {
        var fmin = INT_MAX;
        var index = 0;
        for (var i = 0; i < openList.length; i++) {
          if (openList[i][0].f < fmin) {
            fmin = openList[i][0].f;
            index = i;
          }
        }

        var currNode = new Array();
        currNode[0] = openList[index][0];

        openList.splice(index, 1);
        closedList.push(currNode);

        if (currNode[0].x === end[0].x && currNode[0].y === end[0].y) {
          console.log("Found a path!");
          var path = [];
          var curr = new Array;
          curr[0] = currNode[0];
          while (curr[0].parent) {
            path.push({ x: curr[0].x, y: curr[0].y })
            curr[0] = curr[0].parent[0];
          }
          setautopath(path);
          /*for(var i=path.length-1; i>-1; i--){
              console.log("x: "+path[i].x + ",y: "+path[i].y);
          }*/
          return;
        }

        var children = [];
        var adj = [[0, 1], [1, 1], [1, 0], [0, -1], [-1, 0], [-1, -1], [-1, 1], [1, -1]];

        for (var i = 0; i < adj.length; i++) {
          var check = 0;
          var child = new Array();
          child[0] = { x: currNode[0].x + adj[i][0], y: currNode[0].y + adj[i][1], f: 0, g: 0, h: 0, parent: currNode }

          if (initpos === 2) {
            if (child[0].x > 300 || child[0].x < 0 || child[0].y > 300 || child[0].y < 0) {
              continue;
            }
          }

          else if (initpos === 1) {
            if (child[0].x > 0 || child[0].x < -300 || child[0].y > 300 || child[0].y < 0) {
              continue;
            }
          }
          console.log("Obstacle count: " + obstacles[0]?.x)
          for (var k = 0; k < obstacles.length; k++) {

            if (child[0].x < obstacles[k].x + (15 + (obstaclesize[k] / 2)) && child[0].x > obstacles[k].x - (15 + (obstaclesize[k] / 2)) && child[0].y > obstacles[k].y - (15 + (obstaclesize[k] / 2)) && child[0].y < obstacles[k].y + (15 + (obstaclesize[k] / 2))) {
              check = 1;
              break;
            }
          }
          if (check == 1) { continue; }


          children.push(child);
        }

        for (var k = 0; k < children.length; k++) {
          for (var m = 0; m < closedList.length; m++) {
            if (children[k][0].x == closedList[m][0].x && children[k][0].y == closedList[m][0].y) {
              continue;
            }
          }
          children[k][0].g = (currNode[0].g + 1);
          children[k][0].h = (Math.pow(children[k][0].x - end[0].x, 2) + Math.pow(children[k][0].y - end[0].y, 2))
          children[k][0].f = (children[k][0].g + children[k][0].h);

          for (var i = 0; i < openList.length; i++) {
            if (children[k][0].x == openList[i][0].x && children[k][0].y == openList[i][0].y && children[k][0].g > openList[i][0].g) {
              continue;
            }
          }
          openList.push(children[k]);
        }

      }
      console.log("No path found")
      return;
    }
    Astar();

  }, [autodata])

  const autosweep = async () => {
    if (statuscheck === 0) {
      return;
    }
    setisautosweep(true)
    //const newIntervalId = setInterval(async() => {
    //setCommand(command => command + 1);
    try {
      await axios.post('http://localhost:5000/data/commands', {
        type: 'AutoSweep',
        input: '',
        speed: ''
      })
    } catch (error) {
      console.log(error)
    } finally {
      success()
    }

  }

  return (
    <div id='wrapper'>
      <div className='buttons'>
        <div className='button1'>
          <button className={(statuscheck && !isautosweep)? 'butt' : 'executing'} onClick={sendForward}>
            <div className='buttonName'>Forwards</div>
            <CaretUpOutlined />
          </button>
        </div>
        <div className='button2'>
          <button className={(statuscheck && !isautosweep)? 'butt' : 'executing'} onClick={goto}>
            <div className='buttonName'>GoToPoint</div>
            <VerticalAlignTopOutlined />
          </button >
        </div>
        <div className='button3'>
          <button className={(statuscheck && !isautosweep)? 'butt' : 'executing'} onClick={sendBackward}>
            <div className='buttonName'>Backwards</div>
            <CaretDownOutlined />
          </button>
        </div>
        <div className='button4'>
          <button className={(statuscheck && !isautosweep)? 'butt' : 'executing'} onClick={sendRanticw}>
            <div className='buttonName'>RotateACW</div>
            <UndoOutlined />
          </button>
        </div>
        <div className='button5'>
          <button className={(statuscheck && !isautosweep)? 'butt' : 'executing'} onClick={sendRcw}>
            <div className='buttonName'>RotateCW</div>
            <RedoOutlined />
          </button>
        </div>
        <div className='button6'>
          <button className={(statuscheck && !isautosweep)? 'butt' : 'executing'} onClick={() => setisAuto(true)}>
            <div className='buttonName'>Automated</div>
            <DragOutlined />
          </button>
        </div>
        <div className='button7'>
          <button className={(statuscheck || isauto) && !isautosweep ? 'butt' : 'executing'} onClick={backToBase}>
            <div className='buttonName'>BackToBase</div>
            <VerticalAlignBottomOutlined />
          </button>
        </div>
        <div className='button8'>
          <button className={(statuscheck && !isautosweep) ? 'butt' : 'executing'} onClick={autosweep}>
            <div className='buttonName'>AutoSweep</div>
            <BorderlessTableOutlined />
          </button>
        </div>
      </div>
    </div>


  );
}

export default Cont;