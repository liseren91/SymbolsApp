import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_PASSWORD } from '../components/PasswordModal';

export type UserRole = 'admin' | 'guest';

const ROLE_STORAGE_KEY = '@SymbolsApp:userRole';
const ADMIN_AUTH_STATUS_KEY = '@SymbolsApp:adminAuthStatus';

class RoleService {
  private currentRole: UserRole | null = null;
  private isAdminAuthenticated: boolean = false;

  async initialize(): Promise<UserRole> {
    try {
      const savedRole = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
      this.currentRole = (savedRole as UserRole) || null;
      
      // Если роль не задана, установим гостя по умолчанию
      if (!this.currentRole) {
        this.currentRole = 'guest';
        await this.saveRole(this.currentRole);
      }

      // Загружаем статус аутентификации администратора
      const authStatus = await AsyncStorage.getItem(ADMIN_AUTH_STATUS_KEY);
      this.isAdminAuthenticated = authStatus === 'true';
      
      console.log(`[RoleService] Initialized with role: ${this.currentRole}, isAdminAuthenticated: ${this.isAdminAuthenticated}`);
      return this.currentRole;
    } catch (error) {
      console.error('[RoleService] Failed to initialize role:', error);
      // По умолчанию используем роль гостя при ошибке
      this.currentRole = 'guest';
      this.isAdminAuthenticated = false;
      return this.currentRole;
    }
  }

  async saveRole(role: UserRole): Promise<void> {
    try {
      // Если роль 'admin', убедимся, что аутентификация прошла
      if (role === 'admin' && !this.isAdminAuthenticated) {
        console.error('[RoleService] Cannot set admin role without authentication');
        throw new Error('Authentication required for admin role');
      }

      await AsyncStorage.setItem(ROLE_STORAGE_KEY, role);
      this.currentRole = role;
      console.log(`[RoleService] Role saved: ${role}`);
    } catch (error) {
      console.error('[RoleService] Failed to save role:', error);
      throw error;
    }
  }

  async authenticateAdmin(password: string): Promise<boolean> {
    const isValid = password === ADMIN_PASSWORD;
    
    if (isValid) {
      this.isAdminAuthenticated = true;
      await AsyncStorage.setItem(ADMIN_AUTH_STATUS_KEY, 'true');
      console.log('[RoleService] Admin authenticated successfully');
    } else {
      console.log('[RoleService] Admin authentication failed');
    }
    
    return isValid;
  }

  async logoutAdmin(): Promise<void> {
    this.isAdminAuthenticated = false;
    await AsyncStorage.setItem(ADMIN_AUTH_STATUS_KEY, 'false');
    
    // Если текущая роль - админ, меняем на гостя
    if (this.currentRole === 'admin') {
      this.currentRole = 'guest';
      await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'guest');
    }
    
    console.log('[RoleService] Admin logged out');
  }

  getRole(): UserRole {
    return this.currentRole || 'guest';
  }

  isAdmin(): boolean {
    return this.currentRole === 'admin';
  }

  isGuest(): boolean {
    return this.currentRole === 'guest';
  }

  getAdminAuthStatus(): boolean {
    return this.isAdminAuthenticated;
  }
}

const roleService = new RoleService();
export default roleService; 