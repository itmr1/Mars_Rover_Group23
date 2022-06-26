import React,{useState,useEffect} from 'react'
import axios from 'axios'
import './obstacles.css'


const Obstacles = () => {
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
          
        if(info[0]){    
            if(currObstacles.some(item => (info[0].Location.x < item.x+5) && (item.x-5 < info[0].Location.x) && (info[0].Location.y < item.y+5) && (item.y-5 < info[0].Location.y))){
                
            }
            else{
                
                setcurrObstacles(prevdataAlien=>[...prevdataAlien, info[0].Location])
                if(info[0].type === "alien"){
                    setlistAliens(prevaliens=>[...prevaliens, info[0].Location])
                }
                else if(info[0].type === "building"){
                    setlistBuildings(prevbuildings=>[...prevbuildings,info[0].Location])
                }
                else if(info[0].type === "fan"){
                    setlistFans(prevfans=>[...prevfans, info[0].Location])
                }
                return;
               
            }
        }//)
        
        
        
    },[info])

    return (
        
       <div className='dist'>
            <h3 id='detect'><div id='text'>Detections</div></h3>
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
export default Obstacles

