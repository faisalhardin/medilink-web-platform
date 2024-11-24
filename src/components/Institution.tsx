
import {useEffect, useState} from "react";
import { GetInsitution } from "@requests/institution";
import { Institution as InstitutionModel } from "@models/institution";

const InstitutionProfileComponent = () => {
    const [institution, setInsitution] = useState<InstitutionModel | null>(null);
    useEffect(() => {
        GetInsitution()
          .then((response) => {
            return response.data})
          .then((data) => setInsitution(data));
      }, []);

      return (
        <>
        <h1>
            Institution Component 
        </h1>
        <ul>
              <li> {institution?.id}</li>
              <li> {institution?.name}</li>
            </ul>
        </>
        
      )
}

export default InstitutionProfileComponent;