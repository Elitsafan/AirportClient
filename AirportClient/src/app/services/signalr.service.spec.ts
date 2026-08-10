import { TestBed } from '@angular/core/testing';
import { SignalrService } from './signalr.service';
import * as signalR from '@microsoft/signalr';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { ICredentialsResponse } from '../interfaces/icredentials-response.interface'

describe('SignalrService', () => {
  let service: SignalrService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SignalrService]
    });
    service = TestBed.inject(SignalrService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose connectionError$ observable', () => {
    expect(service.connectionError$).toBeDefined();
  });

  describe('Connection Error Handling', () => {

    it('should emit error when SignalR connection closes', (done) => {
      // Mock HubConnection
      const mockConnection = {
        start: jasmine.createSpy('start').and.returnValue(Promise.resolve()),
        on: jasmine.createSpy('on'),
        onclose: jasmine.createSpy('onclose')
      } as unknown as signalR.HubConnection;

      spyOn(signalR.HubConnectionBuilder.prototype, 'build').and.returnValue(mockConnection);
      spyOn(signalR.HubConnectionBuilder.prototype, 'withUrl').and.returnValue(new signalR.HubConnectionBuilder());

      // Start connection
      service.startConnection();

      // Get the onclose callback
      const oncloseCallback = (mockConnection.onclose as jasmine.Spy).calls.argsFor(0)[0];

      // Subscribe to connection errors
      service.connectionError$.subscribe(error => {
        expect(error).toBeDefined();
        expect(error.message).toContain('Connection to server lost');
        done();
      });

      // Simulate connection close
      oncloseCallback(undefined);
    });

    it('should emit actual error when connection closes with error', (done) => {
      const testError = new Error('Network failure');

      const mockConnection = {
        start: jasmine.createSpy('start').and.returnValue(Promise.resolve()),
        on: jasmine.createSpy('on'),
        onclose: jasmine.createSpy('onclose')
      } as unknown as signalR.HubConnection;

      spyOn(signalR.HubConnectionBuilder.prototype, 'build').and.returnValue(mockConnection);
      spyOn(signalR.HubConnectionBuilder.prototype, 'withUrl').and.returnValue(new signalR.HubConnectionBuilder());

      service.startConnection();
      const oncloseCallback = (mockConnection.onclose as jasmine.Spy).calls.argsFor(0)[0];

      service.connectionError$.subscribe(error => {
        expect(error).toBe(testError);
        done();
      });

      oncloseCallback(testError);
    });
  });

  describe('getAuthToken()', () => {
    const mockCredsResponse: ICredentialsResponse = {
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'password123'
    };
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_token';

    describe('Dev/Local path (credentials in environment)', () => {

      beforeEach(() => {
        // Simulate dev/local environment by setting credentials
        environment.loginCredentials.username = 'admin';
        environment.loginCredentials.password = 'password123';
      });

      afterEach(() => {
        // Always restore to production state (empty)
        environment.loginCredentials.username = '';
        environment.loginCredentials.password = '';
      });

      it('should POST credentials directly to the API and return the token', async () => {
        const tokenPromise = (service as any).getAuthToken();

        const req = httpTestingController.expectOne(
          `${environment.remoteUrl}${environment.authEP}`
        );
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ username: 'admin', password: 'password123' });

        req.flush({ token: mockToken });
        const result = await tokenPromise;
        expect(result).toBe(mockToken);
      });

      it('should return empty string and log error when API login fails', async () => {
        const consoleSpy = spyOn(console, 'error');
        const tokenPromise = (service as any).getAuthToken();

        const req = httpTestingController.expectOne(
          `${environment.remoteUrl}${environment.authEP}`
        );
        req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
        const result = await tokenPromise;

        expect(result).toBe('');
        expect(consoleSpy).toHaveBeenCalledWith('Failed to get SignalR Auth Token', jasmine.anything());
      });
    });

    describe('Production path (credentials from server)', () => {

      it('should GET credentials from server then POST to API and return the token', async () => {
        // environment.loginCredentials are empty (production default)
        const tokenPromise = (service as any).getAuthToken();

        // Step 1: GET credentials from server
        const credsReq = httpTestingController.expectOne(environment.loginCredsUrl);
        expect(credsReq.request.method).toBe('GET');
        credsReq.flush(mockCredsResponse);

        // Step 2: POST login to API with fetched credentials
        const loginReq = httpTestingController.expectOne(
          `${environment.remoteUrl}${environment.authEP}`
        );
        expect(loginReq.request.method).toBe('POST');
        expect(loginReq.request.body).toEqual({
          username: mockCredsResponse.ADMIN_USERNAME,
          password: mockCredsResponse.ADMIN_PASSWORD
        });
        loginReq.flush({ token: mockToken });

        const result = await tokenPromise;
        expect(result).toBe(mockToken);
      });

      it('should return empty string and log error when Azure Functions GET fails', async () => {
        const consoleSpy = spyOn(console, 'error');
        const tokenPromise = (service as any).getAuthToken();

        const credsReq = httpTestingController.expectOne(environment.loginCredsUrl);
        credsReq.flush('Error', { status: 500, statusText: 'Server Error' });

        const result = await tokenPromise;
        expect(result).toBe('');
        expect(consoleSpy).toHaveBeenCalledWith('Failed to get SignalR Auth Token', jasmine.anything());
      });
    });
  });

});
