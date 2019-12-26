<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\User;

class UserController extends Controller
{
    public function view($id)
    {
        $user = new User('yugasun', 'yuga.sun.bj@gmail.com');
        return view('user.profile', ['user' => $user]);
    }
    public function list()
    {
        $user = new User('yugasun', 'yuga.sun.bj@gmail.com');
        return ['data' => array($user)];
    }

    public function user($id)
    {
        $user = new User('yugasun', 'yuga.sun.bj@gmail.com');
        return ['data' => $user];
    }
}
