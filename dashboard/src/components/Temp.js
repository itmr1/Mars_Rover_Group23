import React,{useState,useEffect} from 'react'
import axios from 'axios'
import './temp.css'


const Temp = () => {
    const [info, setInfo] = useState([])
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
        const interval=setInterval(()=>{
            fetchData()
           },1000)
             
             
           return()=>clearInterval(interval)
    }, [])
    return (
        <div className='temp'>
            <div id='content'>
            <h3>Rover-Status</h3>
            <div className='p'>
            {"Location: ("+info[0]?.Location.x}{", "+info[0]?.Location.y+")"}
            </div><div className='p'>
            {"Angle facing: "+info[0]?.angle}
            </div>
            </div>
        </div>
    )
}
export default Temp