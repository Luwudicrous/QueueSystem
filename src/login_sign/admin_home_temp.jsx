import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './admin_home_temp.css'


const AdminHome = () => {


    return (
        <div className="admin-home-background">
        <div className="admin-home-container">
            <h1>Welcome, Admin!</h1>
            <p>This is the admin home page. Here you can manage queues, view analytics, and perform administrative tasks.</p>
        </div>
        </div>
    )
}


export default AdminHome