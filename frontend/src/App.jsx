import Navbar from './Components/Navbar'
import Footer from './Components/Footer'
import { Outlet } from 'react-router-dom'
function App() {


  return (
    <>
      <div>
        <Navbar></Navbar>
        <div className='w-11/12 mx-auto'>
          <Outlet></Outlet>
        </div>

        <Footer></Footer>
      </div>
    </>
  )
}

export default App
