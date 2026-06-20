package com.medicine.api.service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.HttpMethod;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Mints short-lived V4 signed PUT URLs so the browser can upload a PDF straight
 * to the public GCS bucket (bypassing the Vercel function body limit). Signing
 * uses the Cloud Run runtime service account via IAM signBlob, so the SA needs
 * roles/iam.serviceAccountTokenCreator on itself and write access to the bucket.
 */
@Service
public class GcsStorageService {

    private final String bucket;
    private volatile Storage storage; // lazily created to avoid startup coupling

    public GcsStorageService(@Value("${app.gcs.bucket:}") String bucket) {
        this.bucket = bucket == null ? "" : bucket.trim();
    }

    public boolean isEnabled() {
        return !bucket.isEmpty();
    }

    private Storage storage() {
        Storage s = storage;
        if (s == null) {
            synchronized (this) {
                if (storage == null) {
                    storage = StorageOptions.getDefaultInstance().getService();
                }
                s = storage;
            }
        }
        return s;
    }

    /** Returns {"uploadUrl": signed PUT url, "publicUrl": eventual public url}. */
    public Map<String, String> signedUpload(String objectName, String contentType) {
        BlobInfo info = BlobInfo.newBuilder(BlobId.of(bucket, objectName))
                .setContentType(contentType)
                .build();
        URL url = storage().signUrl(info, 15, TimeUnit.MINUTES,
                Storage.SignUrlOption.httpMethod(HttpMethod.PUT),
                Storage.SignUrlOption.withContentType(),
                Storage.SignUrlOption.withV4Signature());
        String publicUrl = "https://storage.googleapis.com/" + bucket + "/" + objectName;
        return Map.of("uploadUrl", url.toString(), "publicUrl", publicUrl);
    }
}
