
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useForm } from 'react-hook-form';
import { ListPatients } from "@requests/patient";
import { GetPatientParam, Patient as PatientModel } from "@models/patient";

interface PatientListComponentParam {
    param: GetPatientParam
}


export const PatientListComponent = () => {

    const { register, handleSubmit, formState: { errors } } = useForm<GetPatientParam>();
    const [patients, setPatients] = useState<PatientModel[]>([]);

    const onSubmit = async (params: GetPatientParam) => {
        try {
            console.log(params);
            // Handle form submission

            const filteredParams: Partial<GetPatientParam> = {};
            if (params.name) filteredParams.name = params.name;
            if (params.nik) filteredParams.nik = params.nik;
            if (params.date_of_birth) filteredParams.date_of_birth = params.date_of_birth;
            if (params.institution_id) filteredParams.institution_id = params.institution_id;
            //   if (params.patient_ids?.length > 0) filteredParams.patient_ids = params.patient_ids;

            const data = await ListPatients(Object.keys(filteredParams).length ? filteredParams : null);
            setPatients(data);
        } catch (err) {
            console.error(err);
        }

    };

    return (
        <div className="p-6 flex flex-col h-screen items-center w-full">
            <div className="justify-center w-full">
                <h2 className="text-2xl font-semibold mb-6">Register New Patient</h2>

                <form onSubmit={handleSubmit(onSubmit)} className=" bg-black p-6 rounded-lg shadow ">
                    <div className="wrap-grid mx-auto my-8">
                        <div className="max-w-60">
                        <label className="block mb-2">Name</label>
                            <input
                                {...register('name')}
                                className="w-full p-2 border rounded"
                            />
                            {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
                        </div>
                        <div className="max-w-60">
                        <label className="block mb-2">NIK</label>
                            <input
                                {...register('nik')}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div className="max-w-60">
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
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Search
                        </button>
                    </div>
                </form>
            </div>
            <table className="table-auto w-full  shadow-md rounded-lg overflow-hidden my-6">
                <thead className="bg-blue-600 text-white">
                    <tr>
                        <th className="text-left px-6 py-3">NIK</th>
                        <th className="text-left px-6 py-3">Name</th>
                        <th className="text-left px-6 py-3">Place of Birth</th>
                        <th className="text-left px-6 py-3">Data of Birth</th>
                        <th className="text-left px-6 py-3">Extra</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map((patient, index) => (
                        <tr key={patient.uuid} className={`${
                            index % 2 === 0 ? "bg-gray-600" : "bg-gray-700"
                          } border-b last:border-none`}>
                            <td className="px-6 py-4">{patient.nik}</td>
                            <td className="px-6 py-4">{patient.name}</td>
                            <td className="px-6 py-4">{patient.place_of_birth}</td>
                            <td className="px-6 py-4">{patient.date_of_birth}</td>
                            <td className="px-6 py-4"> <img src="/src/assets/icons/wmd-detail.svg" className="h-6 w-6"></img></td>
                        </tr>
                    ))}
                    <tr>

                    </tr>
                </tbody>
            </table>
        </div>

    )
}

export const PatientVisitsComponent = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        businessName: "",
        password: "",
    });

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value,
        }));
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(formData);
    };

    return (
        <>
            <main>
                <form onSubmit={handleSubmit}>
                    <input
                        onChange={handleInputChange}
                        value={formData.name}
                        name="name"
                        type={'text'}
                        placeholder={'Enter User Name'}
                    />

                    <input

                        onChange={handleInputChange}
                        value={formData.businessName}
                        name="businessName"
                        type={'text'}
                        placeholder={'Enter Business Name'}
                    />

                    <input
                        onChange={handleInputChange}
                        value={formData.email}
                        name="email"
                        type={'text'}
                        placeholder={'Enter your Email'}
                    />

                    <input
                        onChange={handleInputChange}
                        value={formData.password}
                        name="password"
                        type={'password'}
                        placeholder={'Enter your Password'}
                    />

                    <button type="submit">ok</button>
                </form>

            </main>
        </>
    )
}

interface Patient {
    id: string;
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    bloodType: string;
    contactNumber: string;
    address: string;
    admissionDate: string;
}

export function PatientRegistration() {
    const { register, handleSubmit, formState: { errors } } = useForm<Patient>();

    const onSubmit = (data: Patient) => {
        console.log(data);
        // Handle form submission
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Register New Patient</h2>

            <form onSubmit={handleSubmit(onSubmit)} className=" bg-white p-6 rounded-lg shadow">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-2">Name</label>
                        <input
                            {...register('name', { required: 'Name is required' })}
                            className="w-full p-2 border rounded"
                        />
                        {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
                    </div>

                    <div>
                        <label className="block mb-2">Age</label>
                        <input
                            type="number"
                            {...register('age', { required: 'Age is required', min: 0 })}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block mb-2">Gender</label>
                        <select {...register('gender')} className="w-full p-2 border rounded">
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block mb-2">Blood Type</label>
                        <select {...register('bloodType')} className="w-full p-2 border rounded">
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                        </select>
                    </div>

                    <div>
                        <label className="block mb-2">Contact Number</label>
                        <input
                            {...register('contactNumber', { required: 'Contact number is required' })}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block mb-2">Admission Date</label>
                        <input
                            type="date"
                            {...register('admissionDate')}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block mb-2">Address</label>
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
            </form>
        </div>
    );
}