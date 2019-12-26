<?php

namespace App;

class User
{
   var $name;
   var $email;

   function __construct($name, $email)
   {
       $this->name = $name;
       $this->email = $email;
   }
}
