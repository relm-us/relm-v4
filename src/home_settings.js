import { HtmlMixer } from '../lib/HtmlMixer.js'

import React from 'react'
import ReactDOM from 'react-dom'
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormLabel from '@material-ui/core/FormLabel'

import { Entity } from './entity.js'

class Welcome extends React.Component {
  render() {
    const onClick = () => {
      if (this.props.onNextCharacter) {
        this.props.onNextCharacter()
      }
    }
    const onChangeName = (event) => {
      if (this.props.onChangeName) {
        this.props.onChangeName(event.target.value)
      }
    }
    const onChangeGender = (event) => {
      if (this.props.onChangeGender) {
        this.props.onChangeGender(event.target.value)
      }
    }
    return <div className="welcome-settings">
      <h1>Hello!</h1>
      <TextField id="standard-basic" label="Your Name" onChange={onChangeName} /> 
      <FormControl component="fieldset">
        <FormLabel component="legend">Gender</FormLabel>
        <RadioGroup aria-label="gender" name="gender" value={this.props.gender} onChange={onChangeGender}>
          <FormControlLabel value="f" control={<Radio />} label="Female" />
          <FormControlLabel value="m" control={<Radio />} label="Male" />
        </RadioGroup>
      </FormControl>
      <Button variant="contained" color="primary" onClick={onClick}>Next Character</Button>
    </div>;
  }
}

class HomeSettings extends Entity {
  constructor(x, y, z, opts) {
    super(opts)

    this.x = x
    this.y = y
    this.z = z
    // TODO make w, h work
    this.w = 200
    this.h = 150
    
    
    this.opts = Object.assign({
      scale: 400.0,
      rotate: 0
    }, opts || {})
  }

  createMixerPlane(htmlMixer) {
    let ry = -Math.PI / 4
    if ('rotate' in this.opts) {
      ry -= Math.PI / 2 * this.opts.rotate
    }

    const domElement = document.createElement('div')
    domElement.style.width = this.w + 'px'
    domElement.style.height = this.h + 'px'
    domElement.style.backgroundColor = 'white'

    ReactDOM.render(React.createElement(Welcome, {
      onNextCharacter: this.opts.onNextCharacter,
      onChangeName: this.opts.onChangeName,
      onChangeGender: this.opts.onChangeGender
    }), domElement)

    this.mixerPlane = new HtmlMixer.Plane(htmlMixer, domElement, {elementW: 256, planeW: 0.5})
    this.mixerPlane.object3d.position.x = this.x
    this.mixerPlane.object3d.position.y = this.y
    this.mixerPlane.object3d.position.z = this.z
    this.mixerPlane.object3d.rotation.y = ry
    this.mixerPlane.object3d.scale.x = this.opts.scale
    this.mixerPlane.object3d.scale.y = this.opts.scale
  }

  onAddEntity(stage, parent) {
    this.createMixerPlane(stage.htmlMixer)
    stage.scene.add(this.mixerPlane.object3d)
  }

  onRemoveEntity(stage, parent) {
    stage.scene.remove(this.mixerPlane.object3d)
  }
}

export { HomeSettings }