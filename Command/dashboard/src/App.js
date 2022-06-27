
import './App.css';
import RoverPos from './components/roverposition';
import Obstacles from './components/obstacles';
import Battery from './components/battery';

//import Map from './map/map';
import Reset from './controls/reset';
import React from 'react';
import Start from './map/start'
/*import { Layout } from 'antd';
const { Header, Footer, Sider, Content } = Layout;*/

const App = ()=> {
  return (
    <div className="App">     
      <div className="Components">
        <div className="Map">
          <Start />
        </div>
        <div className="Dashboard">
          <Battery />
          <RoverPos />
          <Obstacles />
          <Reset />
        </div>

      </div>
    </div>
  );
}



export default App;
