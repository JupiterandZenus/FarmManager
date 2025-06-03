import com.farmboy.model.*;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import okhttp3.*;
import java.io.IOException;
import java.lang.reflect.Type;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

public class EFClient {
    private static final String API_BASE_URL = "http://192.168.1.104:3333/api/v1";
    private final OkHttpClient httpClient;
    private final String apiKey;
    private final Gson gson;

    public EFClient(OkHttpClient httpClient, String apiKey) {
        this.httpClient = httpClient;
        this.apiKey = apiKey;
        this.gson = new Gson();
    }

    private Request.Builder createRequestBuilder(String endpoint) {
        return new Request.Builder()
                .url(API_BASE_URL + endpoint)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Accept", "application/json");
    }

    private <T> T executeRequest(Request request, Type responseType) throws IOException {
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected response " + response);
            }
            
            ResponseBody body = response.body();
            if (body == null) {
                throw new IOException("Empty response body");
            }
            
            String responseBody = body.string();
            return gson.fromJson(responseBody, responseType);
        }
    }

    // Account methods
    public PageResult<EFAccount> getAccountPage(int page, int perPage) throws IOException {
        Request request = createRequestBuilder(String.format("/accounts?page=%d&per_page=%d", page, perPage))
                .get()
                .build();
        Type responseType = new TypeToken<PageResult<EFAccount>>(){}.getType();
        return executeRequest(request, responseType);
    }

    public PageResult<EFAccount> getAccountPage(int page, int perPage, Map<String, String> filters) throws IOException {
        HttpUrl.Builder urlBuilder = HttpUrl.parse(API_BASE_URL + "/accounts").newBuilder()
                .addQueryParameter("page", String.valueOf(page))
                .addQueryParameter("per_page", String.valueOf(perPage));
        
        filters.forEach(urlBuilder::addQueryParameter);
        
        Request request = createRequestBuilder("")
                .url(urlBuilder.build())
                .get()
                .build();
        
        Type responseType = new TypeToken<PageResult<EFAccount>>(){}.getType();
        return executeRequest(request, responseType);
    }

    public GetResult<EFAccount> getAccount(long id) throws IOException {
        Request request = createRequestBuilder("/accounts/" + id)
                .get()
                .build();
        Type responseType = new TypeToken<GetResult<EFAccount>>(){}.getType();
        return executeRequest(request, responseType);
    }

    public GetResult<EFAccount> createAccount(EFAccount account) throws IOException {
        RequestBody body = RequestBody.create(
                MediaType.parse("application/json"),
                gson.toJson(account)
        );
        
        Request request = createRequestBuilder("/accounts")
                .post(body)
                .build();
        
        Type responseType = new TypeToken<GetResult<EFAccount>>(){}.getType();
        return executeRequest(request, responseType);
    }

    public GetResult<EFAccount> updateAccount(EFAccount account) throws IOException {
        RequestBody body = RequestBody.create(
                MediaType.parse("application/json"),
                gson.toJson(account)
        );
        
        Request request = createRequestBuilder("/accounts/" + account.getId())
                .put(body)
                .build();
        
        Type responseType = new TypeToken<GetResult<EFAccount>>(){}.getType();
        return executeRequest(request, responseType);
    }

    public void deleteAccount(EFAccount account) throws IOException {
        Request request = createRequestBuilder("/accounts/" + account.getId())
                .delete()
                .build();
        
        executeRequest(request, Object.class);
    }

    public GetResult<EFAccount> getNextTutorialAccount(Map<String, String> filters) throws IOException {
        HttpUrl.Builder urlBuilder = HttpUrl.parse(API_BASE_URL + "/accounts/tutorial").newBuilder();
        filters.forEach(urlBuilder::addQueryParameter);
        
        Request request = createRequestBuilder("")
                .url(urlBuilder.build())
                .get()
                .build();
        
        Type responseType = new TypeToken<GetResult<EFAccount>>(){}.getType();
        return executeRequest(request, responseType);
    }

    public PageResult<EFAccount> getNextCheckAccounts(int count, Map<String, String> filters) throws IOException {
        HttpUrl.Builder urlBuilder = HttpUrl.parse(API_BASE_URL + "/accounts/check").newBuilder()
                .addQueryParameter("count", String.valueOf(count));
        
        filters.forEach(urlBuilder::addQueryParameter);
        
        Request request = createRequestBuilder("")
                .url(urlBuilder.build())
                .get()
                .build();
        
        Type responseType = new TypeToken<PageResult<EFAccount>>(){}.getType();
        return executeRequest(request, responseType);
    }

    public PageResult<EFAgent> getAgentPage(int page, int perPage) throws IOException {
        Request request = createRequestBuilder(String.format("/agents?page=%d&per_page=%d", page, perPage))
                .get()
                .build();
        Type responseType = new TypeToken<PageResult<EFAgent>>(){}.getType();
        return executeRequest(request, responseType);
    }

    public PageResult<EFAgent> getAgentPage(int page, int perPage, Map<String, String> filters) throws IOException {
        HttpUrl.Builder urlBuilder = HttpUrl.parse(API_BASE_URL + "/agents").newBuilder()
                .addQueryParameter("page", String.valueOf(page))
                .addQueryParameter("per_page", String.valueOf(perPage));
        
        filters.forEach(urlBuilder::addQueryParameter);
        
        Request request = createRequestBuilder("")
                .url(urlBuilder.build())
                .get()
                .build();
        
        Type responseType = new TypeToken<PageResult<EFAgent>>(){}.getType();
        return executeRequest(request, responseType);
    }

    // Account Control Methods
    public void stopAccount(long accountId) throws IOException {
        Request request = createRequestBuilder("/accounts/" + accountId + "/stop")
                .post(RequestBody.create(null, new byte[0]))
                .build();
        executeRequest(request, Object.class);
    }

    public void pauseAccount(long accountId) throws IOException {
        Request request = createRequestBuilder("/accounts/" + accountId + "/pause")
                .post(RequestBody.create(null, new byte[0]))
                .build();
        executeRequest(request, Object.class);
    }

    public void resumeAccount(long accountId) throws IOException {
        Request request = createRequestBuilder("/accounts/" + accountId + "/resume")
                .post(RequestBody.create(null, new byte[0]))
                .build();
        executeRequest(request, Object.class);
    }

    public PageResult<EFAccount> getAccountsByCategory(String category, int page, int perPage) throws IOException {
        Map<String, String> filters = new HashMap<>();
        filters.put("category", category);
        return getAccountPage(page, perPage, filters);
    }
} 