package com.medicine.api.service;

import com.medicine.api.dto.MedicineRequest;
import com.medicine.api.exception.ResourceNotFoundException;
import com.medicine.api.model.Medicine;
import com.medicine.api.repository.MedicineRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class MedicineService {

    private final MedicineRepository repository;

    public MedicineService(MedicineRepository repository) {
        this.repository = repository;
    }

    public List<Medicine> findAll(String userId, String query) {
        if (StringUtils.hasText(query)) {
            return repository.search(userId, query.trim());
        }
        return repository.findByUserIdOrderByIdDesc(userId);
    }

    public Medicine findById(String userId, Long id) {
        return repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found: " + id));
    }

    public Medicine create(String userId, MedicineRequest request) {
        Medicine medicine = new Medicine();
        medicine.setUserId(userId);
        apply(medicine, request);
        return repository.save(medicine);
    }

    public Medicine update(String userId, Long id, MedicineRequest request) {
        Medicine medicine = findById(userId, id);
        apply(medicine, request);
        return repository.save(medicine);
    }

    public void delete(String userId, Long id) {
        if (!repository.existsByIdAndUserId(id, userId)) {
            throw new ResourceNotFoundException("Medicine not found: " + id);
        }
        repository.deleteById(id);
    }

    private void apply(Medicine medicine, MedicineRequest request) {
        medicine.setName(request.getName());
        medicine.setDescription(request.getDescription());
        medicine.setDosage(request.getDosage());
        medicine.setQuantity(request.getQuantity());
        medicine.setManufacturer(request.getManufacturer());
        medicine.setExpiryDate(request.getExpiryDate());
    }
}
