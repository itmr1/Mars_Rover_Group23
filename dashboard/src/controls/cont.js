import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { RedoOutlined, UndoOutlined, StopOutlined, DragOutlined, CaretUpOutlined, CaretDownOutlined, VerticalAlignBottomOutlined, VerticalAlignTopOutlined, BorderlessTableOutlined  } from '@ant-design/icons';
import './cont.css'

const Cont = ({ Inputs, Position, setStat }) => {
  const [initpos, setinitpos]=useState()
  const [info, setInfo]=useState([])
  const [obstacleinfo, setobstacleinfo] = useState([])
  const [obstacles, setobstacles]=useState([])
  const [obstaclesize, setobstaclesize] = useState([])
 // const [status, setStatus]=useState("Awaiting command...")
  const [statuscheck, setstatuscheck]=useState(1)
  const [isauto, setisAuto]=useState(false)
  const [timer, settimer] = useState(0)
  const [nextCoords, setnextCoords]=useState({"x": 0, "y": 0})
  const [restart, setrestart]=useState(0)
  
  //const [newX, setnewX]=useState()
  //const [newY, setnewY]=useState()
  useEffect(()=>{
    console.log("pos is "+Position)
    if(Position===1){
      setinitpos(1)
    }
    else if(Position===2){
      setinitpos(2)
    }
    else if(Position===3){
      setinitpos(2)
    }
    else if(Position===4){
      setinitpos(1)
    }
    else{setinitpos("Undefined");return;}
  },[Position])


  useEffect(() => {
    const fetchData = async ()=>{
        try {
            const res = await axios.get('http://localhost:5000/data/aliens')
            setobstacleinfo(res.data)
            console.log(res.data)
        } catch (error) {
            console.log(error)
        }
    }
    fetchData()
    const interval=setInterval(()=>{
        fetchData()
       },5000)
         
       return()=>clearInterval(interval)
  }, [])

  useEffect(()=>{
    if(obstacleinfo.length===0){
      setobstacles([])
      setobstaclesize([])
      return;
    }
    if(obstacleinfo[0]){ 
        if(obstacleinfo[0].type !== "fan"){  
          if(obstacles.some(item => (/*obstacle.Location.x*/obstacleinfo[0].Location.x < item.x+5) && (item.x-5 < obstacleinfo[0].Location.x/*obstacle.Location.x*/) && (/*obstacle.Location.y*/obstacleinfo[0].Location.y < item.y+5) && (item.y-5 < /*obstacle.Location.y*/obstacleinfo[0].Location.y))){
              //console.log("already used alien coord")
          }
          else{
              setobstacles(prevdataAlien=>[...prevdataAlien, obstacleinfo[0].Location])
              setobstaclesize(prevsize=>[...prevsize, obstacleinfo[0].size])
          }
        }
        else{return;}
    }
  
},[obstacleinfo])


  useEffect(() => {
    const fetchData = async ()=>{
        try {
            const res = await axios.get('http://localhost:5000/data/location')
            setInfo(res.data)
            console.log(res.data)
        } catch (error) {
            console.log(error)
        }
    }
    fetchData()
    const interval =setInterval(()=>{
        fetchData()
       },1000)
         
       return()=>clearInterval(interval)
      
}, [])

useEffect(() => {
  if(info[0]){
    if(info[0].finished === 1){
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
    if (statuscheck === 0) {
      return;
    }
    if(!Inputs[3]){
      return;
    }
    //const newIntervalId = setInterval(async() => {
    // setCommand(command => command + 1);
    try {
      await axios.post('http://localhost:5000/data/commands', {
        type: 'forward',
        input: Inputs[0],
        speed: Inputs[3],
      })
    } catch (error) {
      console.log(error)
    }

  }//, 500);
  //setIntervalId(newIntervalId);
  //}

  const sendBackward = async () => {
    if (statuscheck === 0) {
      return;
    }
    if(!Inputs[3]){
      return;
    }
    // const newIntervalId = setInterval(async() => {
    //setCommand(command => command + 1);
    try {
      await axios.post('http://localhost:5000/data/commands', {
        type: 'backward',
        input: Inputs[0],
        speed: Inputs[3],
      })
    } catch (error) {
      console.log(error)
    }

  }//, 500);
  //setIntervalId(newIntervalId);
  // }

  const sendRanticw = async () => {
    if (statuscheck === 0) {
      return;
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
    }

  }//, 500);
  //setIntervalId(newIntervalId);
  //}

  const sendRcw = async () => {
    if (statuscheck === 0) {
      return;
    }
    //const newIntervalId = setInterval(async() => {
    //setCommand(command => command + 1);
    try {
      await axios.post('http://localhost:5000/data/commands', {
        type: 'rotateCW',
        input: Inputs[1],
        speed: ''
      })
    } catch (error) {
      console.log(error)
    }
  }//, 500);
  //setIntervalId(newIntervalId);
  //}

  const goto = async () => {
    if (statuscheck === 0) {
      return;
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
    }
  }


  useEffect(() => {
    if(isauto===true){
      if (statuscheck === 0) {
        setisAuto(false)
        return;
      }
      if(!info[0]){
        setnextCoords({"x":0, "y": 0})
      }
      else{setnextCoords(info[0].Location)}
    }
  },[isauto])

  useEffect(()=>{
    if(isauto===true){
      const Automate = async () => {
        if(statuscheck===0){
          console.log("EXECUTING STILL... WAITING")
          if(restart===0){setrestart(1)}
          else{setrestart(0)}
          return;
        }
        console.log("AUTO FUNC STARTING AT: "+JSON.stringify(nextCoords))
        var angle = Math.floor(Math.random() * (361));
        if(angle<=90){
          var newX = 30*Math.cos(angle*(Math.PI/180))+nextCoords.x
          var newY = 30*Math.sin(angle*(Math.PI/180))+nextCoords.y
        }
        else if(angle<=180 && angle>90){
          var newX = -30*Math.sin((angle-90)*(Math.PI/180))+nextCoords.x
          var newY = 30*Math.cos((angle-90)*(Math.PI/180))+nextCoords.y
        }
        else if(angle<=270 && angle>180){
          var newX = -30*Math.sin((270-angle)*(Math.PI/180))+nextCoords.x
          var newY = -30*Math.cos((270-angle)*(Math.PI/180))+nextCoords.y
        }
        else if(angle<=360 && angle>270){
          var newX = 30*Math.sin((angle-270)*(Math.PI/180))+nextCoords.x
          var newY = -30*Math.cos((angle-270)*(Math.PI/180))+nextCoords.y
        }
        console.log("newX: "+newX)
        console.log("newY: "+newY)
        
        if(initpos===1){
          if(newX>0 || newX<-300 || newY<0 || newY>300){
            if(restart===0){setrestart(1)}
            else{setrestart(0)}
            return;
          }
        }
        else if(initpos===2){
          if(newX<0 || newX>300 || newY>300 || newY <0){
            if(restart===0){setrestart(1)}
            else{setrestart(0)}
            return;
          }
        }
      
        for(var i=0; i<obstacles.length; i++){

          if(obstacles[i].x>nextCoords.x && obstacles[i].y>nextCoords.y){
            if(newX<obstacles[i].x-(15+(obstaclesize[i]/2)) || newY<obstacles[i].y-(15+(obstaclesize[i]/2))){
              console.log("ACCEPTABLE PLACE")
              continue;
            }
          }
          else if(obstacles[i].x>nextCoords.x && obstacles[i].y<nextCoords.y){
            if(newX<obstacles[i].x-(15+(obstaclesize[i]/2)) || newY>obstacles[i].y+(15+(obstaclesize[i]/2))){
              console.log("ACCEPTABLE PLACE")
              continue;
            }
          }
          else if(obstacles[i].x<nextCoords.x && obstacles[i].y<nextCoords.y){
            if(newX>obstacles[i].x+(15+(obstaclesize[i]/2)) || newY>obstacles[i].y+(15+(obstaclesize[i]/2))){
              console.log("ACCEPTABLE PLACE")
              continue;
            }
          }
          else if(obstacles[i].x<nextCoords.x && obstacles[i].y>nextCoords.y){
            if(newX>obstacles[i].x+(15+(obstaclesize[i]/2)) || newY<obstacles[i].y-(15+(obstaclesize[i]/2))){
              console.log("ACCEPTABLE PLACE")
              continue;
            }
          }
          var lineGrad = ((nextCoords.y-newY)/(nextCoords.x-newX)) 
          var lineIntercept = newY-(lineGrad*newX)
          if(((obstacles[i].y-(15+(obstaclesize[i]/2)) - lineIntercept)/lineGrad)>obstacles[i].x-(15+(obstaclesize[i]/2)) && ((obstacles[i].y-(15+(obstaclesize[i]/2)) - lineIntercept)/lineGrad)<obstacles[i].x+(15+(obstaclesize[i]/2)) ){
            console.log("IN A POINT RADIUS")
            if(restart===0){setrestart(1)}
            else{setrestart(0)}
            return;
          }
          else if(((obstacles[i].y+(15+(obstaclesize[i]/2)) - lineIntercept)/lineGrad)>obstacles[i].x-(15+(obstaclesize[i]/2)) && ((obstacles[i].y-(15+(obstaclesize[i]/2)) - lineIntercept)/lineGrad)<obstacles[i].x+(15+(obstaclesize[i]/2))){
            console.log("IN A POINT RADIUS")
            if(restart===0){setrestart(1)}
            else{setrestart(0)}
            return;
          }
          else if((((obstacles[i].x-(15+(obstaclesize[i]/2)))*lineGrad) + lineIntercept)>obstacles[i].y-(15+(obstaclesize[i]/2)) && (((obstacles[i].x-(15+(obstaclesize[i]/2)))*lineGrad) + lineIntercept)<obstacles[i].y+(15+(obstaclesize[i]/2))){
            console.log("IN A POINT RADIUS")
            if(restart===0){setrestart(1)}
            else{setrestart(0)}
            return;
          }
          else if((((obstacles[i].x+(15+(obstaclesize[i]/2)))*lineGrad) + lineIntercept)>obstacles[i].y-(15+(obstaclesize[i]/2)) && (((obstacles[i].x+(15+(obstaclesize[i]/2)))*lineGrad) + lineIntercept)<obstacles[i].y+(15+(obstaclesize[i]/2))){
            console.log("IN A POINT RADIUS")
            if(restart===0){setrestart(1)}
            else{setrestart(0)}
            return;
          }
        }
        
        console.log("Using angle: "+angle)
        setnextCoords(olddata => {return{"x": newX, "y": newY}})
        //Coordinate is reachable...
        try {
          await axios.post('http://localhost:5000/data/location', {
            Location: {"x":newX, "y":newY},
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
      const newtimer = setTimeout(()=>[
        Automate()
      ],3000)
      settimer(newtimer)
      return()=>{clearTimeout(timer)}
    }
  },[nextCoords, restart])

  const backToBase = async () => {
    if (statuscheck === 0 && isauto === false) {
      return;
    }
    if(timer){
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
    }
  }

  const autosweep = async () => {
    if (statuscheck === 0) {
      return;
    }
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
    }

  }

  return (
    <div id='wrapper'>
    <div className='buttons'>
      <div className='button1'>
        <button className={statuscheck?'butt':'executing'} onClick={sendForward}>
          <div className='buttonName'>Forwards</div>
          <CaretUpOutlined />
        </button>
      </div>
      <div className='button2'>
        <button className={statuscheck?'butt':'executing'} onClick={goto}>
          <div className='buttonName'>GoToPoint</div>
          <VerticalAlignTopOutlined />
        </button >
      </div>
      <div className='button3'>
        <button className={statuscheck?'butt':'executing'} onClick={sendBackward}>
          <div className='buttonName'>Backwards</div>
          <CaretDownOutlined />
        </button>
      </div>
      <div className='button4'>
        <button className={statuscheck?'butt':'executing'} onClick={sendRanticw}>
          <div className='buttonName'>RotateACW</div>
          <UndoOutlined />
        </button>
      </div>
      <div className='button5'>
        <button className={statuscheck?'butt':'executing'} onClick={sendRcw}>
          <div className='buttonName'>RotateCW</div>
          <RedoOutlined />
        </button>
      </div>
      <div className='button6'>
        <button className={(statuscheck)?'butt':'executing'} onClick={()=>setisAuto(true)}>
          <div className='buttonName'>Automated</div>
          <DragOutlined />
        </button>
      </div>
      <div className='button7'>
        <button className={(statuscheck || isauto)?'butt':'executing'} onClick={backToBase}>
          <div className='buttonName'>BackToBase</div>
          <VerticalAlignBottomOutlined  />
        </button>
      </div>
      <div className='button8'>
        <button className={(statuscheck)?'butt':'executing'} onClick={autosweep}>
          <div className='buttonName'>AutoSweep</div>
          <BorderlessTableOutlined />
        </button>
      </div>
    </div>
    </div>


  );
}

export default Cont;