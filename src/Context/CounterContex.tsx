import { createContext, useState } from "react";

export const CounterContext = createContext(); // 1


export default function CounterContextProvider ({children}){

    const [counter, setcounter] = useState(0)

function sayHello(){
    console.log("Hello")
}



    return <CounterContext.Provider value={ {   counter, setcounter , sayHello } }>
            {/* app */}

                     {children}

    </CounterContext.Provider>
}