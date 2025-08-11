import {  PatientListComponent } from "@components/PatientComponent";
import { useModalState } from "hooks/useModalState";
import { ModalComponentProps } from "modalRegistry";


export default function PatientPage (props: ModalComponentProps) { 
    const state = useModalState<ModalComponentProps>({state:props});
    const numericId = state?.state?.journey_board_id ? parseInt(state?.state?.journey_board_id, 10) : 0;
   console.log(state, state?.state?.journey_board_id, numericId);
    return (
        <PatientListComponent journey_board_id={numericId}/>
    )
}

