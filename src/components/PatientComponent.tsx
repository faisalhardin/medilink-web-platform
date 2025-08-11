
import { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { InsertPatientVisit, ListPatients, RegisterPatientRequest } from "@requests/patient";
import { GetPatientParam, InsertPatientVisitPayload, Patient as PatientModel, PatientPageProps, PatientVisit, PatientVisitsComponentProps, RegisterPatient as RegisterPatientModel } from "@models/patient";
import { ListVisitsByPatient } from "@requests/patient"
import AdmitIcon from "assets/icons/AdmitIcon";
import { useModal } from "context/ModalContext";

export function PatientListComponent({ journey_board_id }: { journey_board_id?: number }): JSX.Element {

    const { register, handleSubmit, formState: { errors } } = useForm<GetPatientParam>();
    const [patients, setPatients] = useState<PatientModel[]>([]);
    const { closeModal } = useModal();

    const onSubmit = async (params: GetPatientParam) => {
        try {

            const filteredParams: Partial<GetPatientParam> = {};
            if (params.name) filteredParams.name = params.name;
            if (params.nik) filteredParams.nik = params.nik;
            if (params.date_of_birth) filteredParams.date_of_birth = params.date_of_birth;
            if (params.institution_id) filteredParams.institution_id = params.institution_id;

            const data = await ListPatients(Object.keys(filteredParams).length ? filteredParams : null);
            setPatients(data);
        } catch (err) {
            console.error(err);
        }

    };

    const handleAdmitClick = async (payload: InsertPatientVisitPayload) => {
        try {
            await InsertPatientVisit(payload);
            closeModal();
        } catch (e) {
            console.error(e);
            alert('Failed to admit patient.');
        }
    }

    return (
        <div className="w-full h-full overflow-auto">
            <div className="p-6 w-full min-h-screen">
                <div className="w-full mb-6">
                    <h2 className="text-2xl font-semibold mb-6">Register New Patient Visit</h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 rounded-lg shadow text-sm w-full bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                            <div className="w-full">
                                <label className="block mb-2">Name</label>
                                <input
                                    {...register('name')}
                                    className="w-full p-2 border rounded"
                                />
                                {errors.name && <span className="text-red-500">{errors.name.message}</span>}
                            </div>
                            <div className="w-full">
                                <label className="block mb-2">NIK</label>
                                <input
                                    {...register('nik')}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div className="w-full">
                                <label className="block mb-2">Birth Date</label>
                                <input
                                    type="date"
                                    {...register('date_of_birth')}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>
                        <div className="mt-6">
                            <button
                                type="submit"
                                className="bg-primary-8 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>

                <div className="w-full">
                    <table className="table-auto w-full shadow-md rounded-lg overflow-hidden text-sm">
                        <thead className="bg-primary-6 text-white">
                            <tr>
                                <th className="text-left text-xs px-6 py-3">NIK</th>
                                <th className="text-left text-xs px-6 py-3">Name</th>
                                <th className="text-left text-xs px-6 py-3">Place of Birth</th>
                                <th className="text-left text-xs px-6 py-3">Date of Birth</th>
                                <th className="text-left text-xs px-6 py-3">Extra</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map((patient, index) => (
                                <tr key={patient.uuid} className={`${index % 2 === 0 ? "bg-primary-1" : "bg-primary-2"
                                    } border-b last:border-none`}>
                                    <td className="p-4">{patient.nik}</td>
                                    <td className="p-4">{patient.name}</td>
                                    <td className="p-4">{patient.place_of_birth}</td>
                                    <td className="p-4">{patient.date_of_birth}</td>
                                    <td className="p-4">
                                        <a href={`/patient-detail/${patient.uuid}`}><img src="/src/assets/icons/wmd-detail.svg" className="h-6 w-6" /></a>
                                        {journey_board_id && <a onClick={() => handleAdmitClick({
                                            patient_uuid: patient.uuid,
                                            board_id: journey_board_id,
                                        })} > <div className="h-[30px] w-[30px]"> <AdmitIcon /></div></a>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export const PatientVisitsComponent = ({ patientUUID }: PatientVisitsComponentProps) => {
    const [patientVisits, setPatientVisits] = useState<PatientVisit[]>([]);
    useEffect(() => {
        try {
            ListVisitsByPatient(patientUUID).then((data) => {
                setPatientVisits(data);
            });
        } catch (err) {
            console.error(err);
        }
    }, [patientUUID])

    return (
        <div className="p-6 w-full">
            <table className="table-fixed w-full shadow-md rounded-lg overflow-hidden my-6 text-sm">
                <thead className="bg-primary-6 text-white">
                    <tr>
                        <th className="text-left px-6 py-3">Visit Date</th>
                        <th className="text-left px-6 py-3">Action</th>
                        <th className="text-left px-6 py-3">Status</th>
                        <th className="text-left px-6 py-3">Note</th>
                    </tr>
                </thead>
                <tbody>
                    {patientVisits.map((visit, index) => (
                        <tr key={visit.id} className={`${index % 2 === 0 ? "bg-primary-1" : "bg-primary-2"
                            } border-b last:border-none`}>
                            <td className="px-6 py-4">{visit.create_time}</td>
                            <td className="px-6 py-4">{visit.action}</td>
                            <td className="px-6 py-4">{visit.status}</td>
                            <td className="px-6 py-4">{visit.notes}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export function PatientRegistrationComponent() {
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterPatientModel>();

    const onSubmit = async (data: RegisterPatientModel) => {
        try {
            const resp = await RegisterPatientRequest(data);
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className="p-6 w-full min-h-screen">
            <h3 className="font-semibold mb-6">Register New Patient</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 rounded-lg text-sm shadow w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block mb-2 font-medium">Name</label>
                        <input
                            {...register('name', { required: 'Name is required' })}
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>
                    <div className="w-full">
                        <label className="block mb-2 font-medium">Nomor Induk Kependudukan</label>
                        <input
                            type="number"
                            {...register('nik')}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="w-full">
                        <label className="block mb-2 font-medium">Sex</label>
                        <select {...register('sex')} className="w-full p-2 border rounded">
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="w-full">
                        <label className="block mb-2 font-medium">Religion</label>
                        <select {...register('religion')} className="w-full p-2 border rounded">
                            <option value="" disabled selected hidden>select</option>
                            <option value="islam">Islam</option>
                            <option value="katolik">Katolik</option>
                            <option value="protestan">Protestan</option>
                            <option value="budha">Budha</option>
                            <option value="hindu">Hindu</option>
                            <option value="other">Lainnya</option>
                        </select>
                    </div>
                    <div className="w-full">
                        <label className="block mb-2 font-medium">Date of Birth</label>
                        <input
                            type="date"
                            {...register('date_of_birth', { required: true })}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block mb-2 font-medium">Place of Birth</label>
                        <textarea
                            {...register('place_of_birth')}
                            className="w-full p-2 border rounded"
                            rows={3}
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block mb-2 font-medium">Address</label>
                        <textarea
                            {...register('address')}
                            className="w-full p-2 border rounded"
                            rows={3}
                        />
                    </div>
                </div>
                <div className="mt-6">
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Register Patient
                    </button>
                </div>
                {errors.name && <span className="text-red-500">{errors.name.message}</span>}
            </form>
        </div>
    );
}
