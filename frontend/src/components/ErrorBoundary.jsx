import React from 'react';

class ErrorBoundary extends React.Component{
  constructor(props){
    super(props);
    this.state = {hasError:false};
  }

  static getDerivedStateFromError(error){
    return {hasError: true};
  }

  componentDidCatch(error,errorInfo){
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render(){
    if(this.state.hasError){
      return(
      <div className="p-6 bg-red-50 text-red-800 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p>Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
