import { get } from './apiClient';

export const getAssignedTickets = () =>
  get('/support/getAssignedTickets');

export const getSupportStats = () =>
  get('/support/supportStats');

export const getUnreadNotifications = () =>
  get('/support/getUnreadNotifications');