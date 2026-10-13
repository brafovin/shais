import { Component } from 'react'

/** Shows a friendly message instead of a blank area when WebGL isn't available. */
export default class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) {
      return <div className="scene-fallback">3D preview unavailable on this device — WebGL is required.</div>
    }
    return this.props.children
  }
}
