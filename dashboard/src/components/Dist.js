import React,{useState,useEffect} from 'react'
import axios from 'axios'
import './dist.css'
import _ from 'underscore';

const Dist = () => {
    const [info, setInfo] = useState([])
    const [currObstacles, setcurrObstacles]=useState([])
    const [listAliens, setlistAliens]=useState([])
    const [listBuildings, setlistBuildings]=useState([])
    const [listFans, setlistFans]=useState([])
    
    useEffect(() => {
        const fetchData = async ()=>{
            try {
                const res = await axios.get('http://localhost:5000/data/aliens')
                setInfo(res.data)
                console.log(res.data)
            } catch (error) {
                console.log(error)
            }
        }
        fetchData()
        const interval=setInterval(()=>{
            fetchData()
           },1000)
             
           return()=>clearInterval(interval)
    }, [])

    useEffect(()=>{
        if(info.length===0){
            setcurrObstacles([])
            return;
        }
        //info?.map((obstacle, index)=>{  
        if(info[0]){    
            if(currObstacles.some(item => (/*obstacle.Location.x*/info[0].Location.x < item.x+5) && (item.x-5 < info[0].Location.x/*obstacle.Location.x*/) && (/*obstacle.Location.y*/info[0].Location.y < item.y+5) && (item.y-5 < /*obstacle.Location.y*/info[0].Location.y))){
                //console.log("already shown alien coord")
            }
            else{
                //console.log("showing alien data!...")
                setcurrObstacles(prevdataAlien=>[...prevdataAlien, /*obstacle.Location*/info[0].Location])
                if(/*obstacle.type*/info[0].type === "alien"){
                    setlistAliens(prevaliens=>[...prevaliens, /*obstacle.Location*/info[0].Location])
                }
                else if(/*obstacle.type*/info[0].type === "building"){
                    setlistBuildings(prevbuildings=>[...prevbuildings, /*obstacle.Location*/info[0].Location])
                }
                else if(/*obstacle.type*/info[0].type === "fan"){
                    setlistFans(prevfans=>[...prevfans, /*obstacle.Location*/info[0].Location])
                }
                return;
                //console.log("pushed alien!")
            }
        }//)
        
        
        
    },[info])


    /*useEffect(()=>{
        var currX = coords[0]?.Location.x;
        var currY = coords[0]?.Location.y;
        var currAngle = coords[0]?.Location.angle;
        var alienID = info[0]?.ID;
        var alienDist = info[0]?.distance;
        if(currAngle<=90){
            var tempX = alienDist*Math.sin(currAngle*(Math.PI/180))
            var tempY = alienDist*Math.cos(currAngle*(Math.PI/180))
        }
        else if(currAngle<=180){
            currAngle = currAngle-90;
            var tempX = alienDist*Math.cos(currAngle*(Math.PI/180))
            var tempY = -alienDist*Math.sin(currAngle*(Math.PI/180))
        }
        else if(currAngle<=270){
            currAngle = currAngle-180;
            var tempX = -alienDist*Math.sin(currAngle*(Math.PI/180))
            var tempY = -alienDist*Math.cos(currAngle*(Math.PI/180))
        }
        else if(currAngle<=360){
            currAngle = currAngle-270;
            var tempX = -alienDist*Math.cos(currAngle*(Math.PI/180))
            var tempY = alienDist*Math.sin(currAngle*(Math.PI/180))
        }
        var newX = currX+tempX;
        var newY = currY+tempY;
        const inputCoords = {"id": alienID, "x": newX, "y": newY}
        alienCoords.push(inputCoords);
    },[info])*/

    /*useEffect(()=>{
        if(info[0]){
            if(currImgs.length==0 || !(imgIds.includes(info[0].id))){
                setcurrImgs(currImgs=>[...currImgs, info[0].img])
                setimgIds(imgIds=>[...imgIds, info[0].id])
            }
            else{
                console.log("image already seen")
            }
        }
        else{
            setcurrImgs([]);
            setimgIds([]);
        }
    },[info])*/

    return (
        
       <div className='dist'>
        <div id='detect'><h2>Detections</h2></div>
            <div className='infowrap'>
                <div className='alieninfo'>
                <div className='detectname'>Alien-Coords</div>
                {listAliens?.map((aliens, index) => (
                    <p>{aliens.x},{aliens.y}</p>
                ))}
                </div>
                <div className='buildinginfo'>
                <div className='detectname'>Building-Coords</div>
                {listBuildings?.map((building, index) => (
                    <p>{building.x},{building.y}</p>
                ))}
                </div>
                <div className='faninfo'>
                <div className='detectname'>Fan-Coords</div>
                {listFans?.map((fan, index) => (
                    <p>{fan.x},{fan.y}</p>
                ))}
                </div>
            </div>
        
       </div>
        //<div className='dist'><h3>Alien-Coords</h3>{info?.type}: {"("+info?.Location.x}{", "+info.Location.y+")"}</div>
    )
}
export default Dist

