import React,{useState,useEffect} from 'react'
import axios from 'axios'
import './battery.css'
import { Progress } from 'antd';

const Battery = () => {
    const [info, setInfo] = useState([])
    useEffect(() => {
        const fetchData = async ()=>{
            try {
                const res = await axios.get('http://localhost:5000/data/battery')
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
        
        <div className='humid'>
            <h3 id="batt"><div id='text'>Battery</div></h3>
            <Progress
                id='circle'
                type="circle"
                strokeColor={{
                    '0%': "#108ee9",
                    '100%': '#87d068',
                }}
                percent={info[0]?.Health}
                strokeWidth='7'
                
            />
        </div>
    )
}
export default Battery