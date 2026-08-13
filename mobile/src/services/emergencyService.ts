import { Linking } from 'react-native';

import { incidentService } from './incidentService';
import { userService } from './userService';

export const emergencyService = {
  async trigger(tripId: string): Promise<{ incidentReported: boolean; contactName: string }> {
    const profile = await userService.getMyProfile();
    if (!profile.emergencyContactPhone || !profile.emergencyContactName) {
      throw new Error('Configura primero un contacto de emergencia en Ajustes.');
    }

    let incidentReported = true;
    try {
      await incidentService.report(tripId, 'SAFETY', 'Alerta SOS activada desde la aplicación durante el viaje.');
    } catch {
      incidentReported = false;
    }

    const supported = await Linking.canOpenURL(`tel:${profile.emergencyContactPhone}`);
    if (!supported) {
      throw new Error('Este dispositivo no permite iniciar llamadas.');
    }
    await Linking.openURL(`tel:${profile.emergencyContactPhone}`);
    return { incidentReported, contactName: profile.emergencyContactName };
  },
};
