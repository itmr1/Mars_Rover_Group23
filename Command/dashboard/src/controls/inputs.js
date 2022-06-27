import React, { useState, useEffect } from 'react';
import 'antd/dist/antd.css';
import { Slider, InputNumber, Row, Col, Select } from 'antd';
import './inputs.css'
import Cont from './controls'
const { Option } = Select;

const Input = ({Pos, changepos, setclearRover, changestat}) => {
  const [inputValueM1, setInputValueM1] = useState(0);
  const [inputValueM2, setInputValueM2] = useState(0);
  const [inputx, setinputx] = useState(0)
  const [inputy, setinputy] = useState(0)
  const [inputValueM3, setInputValueM3] = useState()


  const onChangeM1 = (newValue) => {
    setInputValueM1(newValue);
  };
  const onChangeM2 = (newValue) => {
    setInputValueM2(newValue);
  };

  const onChangeX = (newValue) => {
    setinputx(newValue);
  }

  const onChangeY = (newValue) => {
    setinputy(newValue);
  }

  const onChangeM3 = (newValue) => {
    setInputValueM3(newValue);
  }

  const [inputs, setInputs] = useState([])

  useEffect(() => {
    const setInput = () => {
      setInputs([inputValueM1, inputValueM2, {"x":inputx, "y":inputy}, inputValueM3])
    }
    setInput()
    const interval = setInterval(() => {
      setInput()
    }, 0)

    return () => clearInterval(interval)
  }, [inputValueM1, inputValueM2, inputx, inputy, inputValueM3])

  return (
    <div id='sliders'>
      <div className="Controls">
      <div className="mapbuttons">
                  <button id='changebutt' onClick={()=>changepos(0)}>
                  Change initial position
                  </button>
                  <button id='clearbutt' onClick={()=>setclearRover(1)}>Clear rover path</button>
        </div>
        <div className='slider'>
          <div className='distspeedslider'>
              <Row style>
                <div className='distslider'>
                  <div className='enterinfo'>Enter Distance (Forward/Backward)</div>
                  <div className='dslidercomps'>
                  <Col span={13}>
                    <Slider
                      min={0}
                      max={255}
                      onChange={onChangeM1}
                      value={typeof inputValueM1 === 'number' ? inputValueM1 : 0}
                    />
                  </Col>
                  <Col span={4}>
                    <InputNumber
                      min={0}
                      max={255}
                      style={{
                        margin: '0 16px',
                      }}
                      value={inputValueM1}
                      onChange={onChangeM1}
                    />
                  </Col>
                  </div>
                </div>
                <div className='speedslider'>
                <div className='enterinfo'>Enter Speed</div>
                <Col span={10}>
                  <Select
                    style={{
                      margin: '0 16px',
                      width: '100px',
                    }}
                    onChange={onChangeM3}
                  >
                    <Option value="1">Very Slow</Option>
                    <Option value="2">Slow</Option>
                    <Option value="3">Normal</Option>
                    <Option value="4">Fast</Option>
                    <Option value="5">Very Fast</Option>
                  </Select>
                </Col>
                </div>
              </Row>
          </div>
          
          <div className='angslider'>
          <div className='angtitle'>Enter Angle (Rotation)</div>
          <Row>
            <Col span={15}>
              <Slider
                min={0}
                max={359}
                onChange={onChangeM2}
                value={typeof inputValueM2 === 'number' ? inputValueM2 : 0}
              />
            </Col>
            <Col span={4}>
              <InputNumber
                min={0}
                max={359}
                style={{
                  margin: '0 16px',
                }}
                value={inputValueM2}
                onChange={onChangeM2}
              />
            </Col>
          </Row>
          </div>
          <div className='enterinfo'>Enter Point (GoToPoint)</div>
          <Row className='coordinputs'>
          <Row span={2}>
              <label>x:</label>
              <InputNumber
                min={-150}
                max={150}
                style={{
                  marginLeft: '5px',
                }}
                value={inputx}
                onChange={onChangeX}
              />
            </Row>
            <Row style={{marginLeft:'10px'}} span={2}>
              <label>y:</label>
              <InputNumber
                min={-150}
                max={150}
                style={{marginLeft:'5px'}}
                value={inputy}
                onChange={onChangeY}
              />
            </Row>
          </Row>
          
        </div>
        <div className='contbutts'>
        <Cont Inputs={inputs} Position={Pos} setStat={changestat} />
        </div>
      </div>
    </div>
  );
};

export default Input

