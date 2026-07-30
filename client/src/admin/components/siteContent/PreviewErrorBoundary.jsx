// client/src/admin/components/siteContent/PreviewErrorBoundary.jsx
import { Component } from "react";

export default class PreviewErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl bg-[#F2F2F2] border border-[#DDDDDD] p-10 text-center text-sm text-[#333333]/60">
          Preview unavailable for this page right now.
        </div>
      );
    }

    return this.props.children;
  }
}
