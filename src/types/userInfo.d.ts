import type { Mode } from "@/constants/questions";

export interface UserInfo {
    uid: string;
    role: string;
    email: string;
    adminId: string;
    // El puntaje marcado en cada ítem, de 0 a 4.
    answers?: Record<number, number>;
    invitationCode: string;
    lastTestDate?: Date;
    personalInfo: {
        apellidos: string;
        carrera: string;
        ciclo: string;
        departamento: string;
        edad: number;
        nombres: string;
        sexo: string;
        universidad: string;
        // Opcional: solo lo tiene quien lo dio al registrarse.
        celular?: string;
    }
    testDuration?: number;
    // Un puntaje por dominio, más el total de conductas riesgosas, que tiene
    // su propia escala de 0 a 104 y no se deduce del nivel de los dominios
    // sino de la suma de los 26 ítems.
    testResults?: Record<Mode | "total", Results>;
    hasRetakenTest?: boolean;
}
export interface Results {
    level: string;
    score: number;
}
