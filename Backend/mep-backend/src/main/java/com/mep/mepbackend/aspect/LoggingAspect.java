package com.mep.mepbackend.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.service.ActivityLogService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
public class LoggingAspect {

    @Autowired
    private ActivityLogService logService;

    @Autowired
    private ObjectMapper objectMapper; // để chuyển object thành JSON

    // Intercept tất cả các method trong service layer có tên bắt đầu bằng save, update, delete
    @Around("execution(* com.mep.mepbackend.service.*.save*(..)) || " +
            "execution(* com.mep.mepbackend.service.*.update*(..)) || " +
            "execution(* com.mep.mepbackend.service.*.delete*(..))")
    public Object logServiceMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        // Lấy thông tin method và tham số
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String methodName = signature.getName();
        Object[] args = joinPoint.getArgs();

        // Xác định entity type dựa trên tên method (có thể cải tiến bằng annotation)
        String entityType = extractEntityType(methodName);
        Long entityId = null;
        Object oldEntity = null;
        Object newEntity = null;
        String action = methodName.startsWith("save") ? "CREATE" :
                methodName.startsWith("update") ? "UPDATE" : "DELETE";

        // Lấy username từ SecurityContext
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null && auth.isAuthenticated()) ? auth.getName() : "system";

        // Lấy IP và UserAgent từ request (nếu có)
        String ipAddress = null;
        String userAgent = null;
        try {
            HttpServletRequest request = (HttpServletRequest) ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            ipAddress = request.getRemoteAddr();
            userAgent = request.getHeader("User-Agent");
        } catch (Exception e) {}

        // Đối với update: cần lấy entity cũ (dùng reflection để truy xuất id và lấy từ repository)
        // Ở đây tôi giả định args[0] là id, args[1] là dto mới. Bạn có thể điều chỉnh theo logic thực tế.
        if (methodName.startsWith("update") && args.length >= 2) {
            // Giả sử args[0] là Long id
            entityId = (Long) args[0];
            // Cần lấy old entity từ repository dựa trên entityType và id
            // Ví dụ: gọi service tương ứng để tìm
            // Vì là Aspect nên không inject được tất cả service, ta có thể dùng ApplicationContext để lấy bean.
            // Hoặc bạn có thể truyền thêm tham số. Tôi sẽ để placeholder.
        } else if (methodName.startsWith("delete") && args.length >= 1) {
            entityId = (Long) args[0];
        } else if (methodName.startsWith("save")) {
            // Với save, đối tượng mới là args[0] (sau khi save sẽ có id)
            // Ta sẽ log sau khi save xong để có id
        }

        // Thực thi method
        Object result = joinPoint.proceed();

        // Sau khi thực hiện, lấy giá trị mới (result hoặc args)
        // Với save/update, result thường là entity đã lưu.
        String newValuesJson = null;
        if (result != null) {
            newValuesJson = objectMapper.writeValueAsString(result);
        }

        // Lấy entityId từ kết quả (nếu chưa có)
        if (entityId == null && result != null) {
            try {
                Field idField = result.getClass().getDeclaredField("id");
                idField.setAccessible(true);
                entityId = (Long) idField.get(result);
            } catch (Exception ignored) {}
        }

        // Ghi log
        logService.log(username, action, entityType, entityId, null, newValuesJson, ipAddress, userAgent);

        return result;
    }

    private String extractEntityType(String methodName) {
        if (methodName.contains("Project")) return "Project";
        if (methodName.contains("Vendor")) return "Vendor";
        if (methodName.contains("Item")) return "Item";
        if (methodName.contains("MaterialRequest")) return "MR";
        if (methodName.contains("PurchaseRequest")) return "PR";
        if (methodName.contains("PurchaseOrder")) return "PO";
        if (methodName.contains("GoodsReceipt")) return "GRN";
        if (methodName.contains("StockTransfer")) return "STO";
        if (methodName.contains("Warehouse")) return "Warehouse";
        if (methodName.contains("User")) return "User";
        return "Unknown";
    }
}