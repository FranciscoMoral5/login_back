export function ok(res, data, meta) {
return res.json({ status: 'OK', data, ...(meta ? { meta } : {}) });
}


export function created(res, data, meta) {
return res.status(201).json({ status: 'OK', message: 'Creado', data, ...(meta ? { meta } : {}) });
}


export function badRequest(res, message, details) {
return res.status(400).json({ status: 'ERROR', message, ...(details ? { error: details } : {}) });
}


export function notFound(res, message) {
return res.status(404).json({ status: 'ERROR', message });
}


export function fail(res, message, err) {
return res.status(500).json({ status: 'ERROR', message, error: err?.message || err });
}