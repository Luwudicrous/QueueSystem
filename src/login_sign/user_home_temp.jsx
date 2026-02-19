import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './user_home_temp.css'


const UserHome = () => {


    return (
        <div className="user-home-background">
        <div className="user-home-container">
            <h1>Welcome, User!</h1>
            <p>This is the User home page. Here you can manage your queues.</p>
        </div>
        </div>
    )
}


export default UserHome